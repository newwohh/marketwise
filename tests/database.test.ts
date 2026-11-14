// Execute the actual Supabase migrations in Postgres WASM. Only Supabase's
// auth.users/auth.uid runtime and database roles are supplied by this fixture;
// policies, tables, triggers and RPC functions come from the tracked SQL files.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ALICE = "00000000-0000-0000-0000-000000000001";
const BOB = "00000000-0000-0000-0000-000000000002";
const ALICE_DRAFT = "10000000-0000-0000-0000-000000000001";
const ALICE_PUBLIC = "10000000-0000-0000-0000-000000000002";
const BOB_DRAFT = "10000000-0000-0000-0000-000000000003";
const BOB_PUBLIC = "10000000-0000-0000-0000-000000000004";
let db: PGlite;

async function asRole<T>(role: "anon" | "authenticated" | "service_role", user: string | null, run: (tx: Transaction) => Promise<T>) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
    return run(tx);
  });
}
function payload(overrides: Record<string, unknown> = {}) {
  return { id: "sub_alice", user_id: ALICE, customer_id: "cus_alice", status: "active", current_period_end: "2027-01-01T00:00:00Z", price_id: "price_monthly", cancel_at_period_end: false, ...overrides };
}
async function syncSubscription(data: Record<string, unknown>, event: string, created: number) {
  return asRole("service_role", null, async tx => {
    const result = await tx.query<{ synced: boolean }>("select public.sync_stripe_subscription($1::jsonb, $2, $3::bigint) as synced", [JSON.stringify(data), event, created]);
    return result.rows[0].synced;
  });
}
async function syncWatchlist(user: string, items: unknown) {
  return asRole("authenticated", user, async tx => (await tx.query<{ market: string; symbol: string }>("select * from public.sync_watchlist($1::jsonb)", [JSON.stringify(items)])).rows);
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.waitReady;
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const directory = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
  for (const migration of readdirSync(directory).filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`${directory}/${migration}`, "utf8"));
  }
}, 60000);

beforeEach(async () => {
  await db.exec("truncate auth.users cascade; truncate public.webhook_events;");
  await db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2::jsonb), ($3, $4::jsonb)", [ALICE, JSON.stringify({ display_name: " Alice " }), BOB, JSON.stringify({ display_name: "Bob" })]);
  await db.query(`insert into public.posts(id,author_id,author_name,title,body,published) values
    ($1,$5,'Alice','Alice draft','Private research',false),
    ($2,$5,'Alice','Alice public','Published research',true),
    ($3,$6,'Bob','Bob draft','Private research',false),
    ($4,$6,'Bob','Bob public','Published research',true)`, [ALICE_DRAFT, ALICE_PUBLIC, BOB_DRAFT, BOB_PUBLIC, ALICE, BOB]);
});
afterAll(async () => { await db?.close(); });

describe("actual profile RLS and signup trigger", () => {
  it("creates profiles from auth.users and isolates one user from another", async () => {
    const alice = await asRole("authenticated", ALICE, tx => tx.query<{ id: string; display_name: string }>("select id, display_name from public.profiles"));
    expect(alice.rows).toEqual([{ id: ALICE, display_name: "Alice" }]);
    const bob = await asRole("authenticated", BOB, tx => tx.query<{ id: string }>("select id from public.profiles"));
    expect(bob.rows).toEqual([{ id: BOB }]);
  });
  it("allows owner edits but hides another user's profile from updates", async () => {
    const own = await asRole("authenticated", ALICE, tx => tx.query<{ display_name: string }>("update public.profiles set display_name='Updated Alice' where id=$1 returning display_name", [ALICE]));
    expect(own.rows).toEqual([{ display_name: "Updated Alice" }]);
    const other = await asRole("authenticated", ALICE, tx => tx.query("update public.profiles set display_name='Impersonated' where id=$1 returning id", [BOB]));
    expect(other.rows).toEqual([]);
    expect((await db.query<{ display_name: string }>("select display_name from public.profiles where id=$1", [BOB])).rows[0].display_name).toBe("Bob");
  });
  it("rejects creating a profile on behalf of another user and denies anonymous reads", async () => {
    await db.query("delete from public.profiles where id=$1", [BOB]);
    await expect(asRole("authenticated", ALICE, tx => tx.query("insert into public.profiles(id,display_name) values($1,'Spoofed')", [BOB]))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("anon", null, tx => tx.query("select * from public.profiles"))).rejects.toMatchObject({ code: "42501" });
  });
});

describe("actual post RLS", () => {
  it("shows public posts anonymously and only the signed-in author's private drafts", async () => {
    const publicPosts = await asRole("anon", null, tx => tx.query<{ id: string }>("select id from public.posts order by id"));
    expect(publicPosts.rows.map(row => row.id)).toEqual([ALICE_PUBLIC, BOB_PUBLIC]);
    const own = await asRole("authenticated", ALICE, tx => tx.query<{ id: string }>("select id from public.posts order by id"));
    expect(own.rows.map(row => row.id)).toEqual([ALICE_DRAFT, ALICE_PUBLIC, BOB_PUBLIC]);
  });
  it("allows owners to create, publish and delete their own posts", async () => {
    const result = await asRole("authenticated", ALICE, tx => tx.query<{ id: string }>("insert into public.posts(author_id,title,body) values($1,'A new idea','Research body') returning id", [ALICE]));
    const id = result.rows[0].id;
    await asRole("authenticated", ALICE, tx => tx.query("update public.posts set published=true where id=$1", [id]));
    expect((await asRole("anon", null, tx => tx.query("select id from public.posts where id=$1", [id]))).rows).toHaveLength(1);
    await asRole("authenticated", ALICE, tx => tx.query("delete from public.posts where id=$1", [id]));
    expect((await db.query("select id from public.posts where id=$1", [id])).rows).toEqual([]);
  });
  it("prevents author spoofing, ownership reassignment and changes to another author's public post", async () => {
    await expect(asRole("authenticated", ALICE, tx => tx.query("insert into public.posts(author_id,title,body) values($1,'Spoofed','Body')", [BOB]))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("authenticated", ALICE, tx => tx.query("update public.posts set author_id=$1 where id=$2", [BOB, ALICE_DRAFT]))).rejects.toMatchObject({ code: "42501" });
    const update = await asRole("authenticated", ALICE, tx => tx.query("update public.posts set title='Stolen' where id=$1 returning id", [BOB_PUBLIC]));
    const remove = await asRole("authenticated", ALICE, tx => tx.query("delete from public.posts where id=$1 returning id", [BOB_PUBLIC]));
    expect(update.rows).toEqual([]); expect(remove.rows).toEqual([]);
  });
  it("does not permit anonymous publishing", async () => {
    await expect(asRole("anon", null, tx => tx.query("insert into public.posts(author_id,title,body,published) values($1,'Spam','Body',true)", [ALICE]))).rejects.toMatchObject({ code: "42501" });
  });
});

describe("server-only subscription writes and webhook SQL", () => {
  it("grants the actual service role direct billing-customer and webhook-event access", async () => {
    const serverRows = await asRole("service_role", null, async tx => {
      await tx.query("insert into public.billing_customers(user_id,customer_id) values($1,'cus_server_alice'),($2,'cus_server_bob')", [ALICE, BOB]);
      await tx.query("insert into public.webhook_events(id,event_created) values('evt_server_direct',100)");
      return {
        customers: (await tx.query<{ customer_id: string }>("select customer_id from public.billing_customers order by customer_id")).rows,
        events: (await tx.query<{ id: string }>("select id from public.webhook_events")).rows,
      };
    });
    expect(serverRows.customers).toEqual([{ customer_id: "cus_server_alice" }, { customer_id: "cus_server_bob" }]);
    expect(serverRows.events).toEqual([{ id: "evt_server_direct" }]);
  });
  it("does not grant either browser role any webhook or billing-customer write capability", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      for (const table of ["subscriptions", "billing_customers", "webhook_events"]) {
        const capabilities = await db.query<{ writable: boolean }>("select has_table_privilege($1, $2, 'INSERT,UPDATE,DELETE') as writable", [role, `public.${table}`]);
        expect(capabilities.rows[0].writable, `${role} must not write ${table}`).toBe(false);
      }
    }
  });
  it("allows users to read only their own subscriptions and forbids all client mutations", async () => {
    await syncSubscription(payload(), "evt_alice", 100);
    await syncSubscription(payload({ id: "sub_bob", user_id: BOB, customer_id: "cus_bob" }), "evt_bob", 100);
    const own = await asRole("authenticated", ALICE, tx => tx.query<{ id: string }>("select id from public.subscriptions"));
    expect(own.rows).toEqual([{ id: "sub_alice" }]);
    await expect(asRole("authenticated", ALICE, tx => tx.query("update public.subscriptions set status='active' where id='sub_alice'"))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("authenticated", ALICE, tx => tx.query("insert into public.subscriptions(id,user_id,customer_id,status) values('sub_fake',$1,'cus_fake','active')", [ALICE]))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("authenticated", ALICE, tx => tx.query("delete from public.subscriptions"))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("authenticated", ALICE, tx => tx.query("select public.sync_stripe_subscription($1::jsonb,'evt_client',500)", [JSON.stringify(payload())]))).rejects.toMatchObject({ code: "42501" });
  });
  it("applies an event once and refuses replayed or older subscription state", async () => {
    expect(await syncSubscription(payload(), "evt_new", 200)).toBe(true);
    expect(await syncSubscription(payload({ status: "canceled" }), "evt_new", 200)).toBe(false);
    expect(await syncSubscription(payload({ status: "past_due" }), "evt_old", 100)).toBe(false);
    const result = await db.query<{ status: string; last_event_created: number }>("select status,last_event_created from public.subscriptions where id='sub_alice'");
    expect(result.rows[0].status).toBe("active"); expect(Number(result.rows[0].last_event_created)).toBe(200);
    expect((await db.query("select id from public.webhook_events")).rows).toHaveLength(2);
  });
  it("does not move an existing subscription to another user or customer", async () => {
    await syncSubscription(payload(), "evt_original", 100);
    expect(await syncSubscription(payload({ user_id: BOB }), "evt_other_user", 200)).toBe(false);
    expect(await syncSubscription(payload({ customer_id: "cus_other" }), "evt_other_customer", 300)).toBe(false);
    const record = (await db.query<{ user_id: string; customer_id: string }>("select user_id,customer_id from public.subscriptions where id='sub_alice'")).rows[0];
    expect(record).toEqual({ user_id: ALICE, customer_id: "cus_alice" });
  });
  it("rolls the event marker back on invalid data so the same Stripe event can be retried", async () => {
    await expect(syncSubscription(payload({ user_id: "00000000-0000-0000-0000-000000000099" }), "evt_retry", 100)).rejects.toMatchObject({ code: "23503" });
    expect((await db.query("select id from public.webhook_events where id='evt_retry'")).rows).toEqual([]);
    expect(await syncSubscription(payload(), "evt_retry", 100)).toBe(true);
  });
  it("keeps billing customer ownership private and server-write-only", async () => {
    await asRole("service_role", null, tx => tx.query("insert into public.billing_customers(user_id,customer_id) values($1,'cus_alice'),($2,'cus_bob')", [ALICE, BOB]));
    const own = await asRole("authenticated", ALICE, tx => tx.query<{ customer_id: string }>("select customer_id from public.billing_customers"));
    expect(own.rows).toEqual([{ customer_id: "cus_alice" }]);
    await expect(asRole("authenticated", ALICE, tx => tx.query("update public.billing_customers set customer_id='cus_fake'"))).rejects.toMatchObject({ code: "42501" });
    await expect(asRole("anon", null, tx => tx.query("select * from public.webhook_events"))).rejects.toMatchObject({ code: "42501" });
  });
});

describe("atomic capped watchlist RPC", () => {
  it("retains a new key by evicting the oldest, and repeated keys do not expand the list", async () => {
    const original = Array.from({ length: 100 }, (_, i) => `crypto:asset${i}`);
    expect(await syncWatchlist(ALICE, original)).toHaveLength(100);
    const merged = await syncWatchlist(ALICE, ["crypto:newest"]);
    expect(merged).toHaveLength(100);
    expect(merged.some(row => row.symbol === "asset0")).toBe(false);
    expect(merged.at(-1)).toEqual({ market: "crypto", symbol: "newest" });
    expect(await syncWatchlist(ALICE, ["crypto:newest", "crypto:newest"])).toHaveLength(100);
  });
  it("uses auth.uid for identity and keeps users isolated", async () => {
    await syncWatchlist(ALICE, ["crypto:bitcoin", "stocks:aapl"]);
    const bob = await syncWatchlist(BOB, ["crypto:ethereum"]);
    expect(bob).toEqual([{ market: "crypto", symbol: "ethereum" }]);
    const alice = await syncWatchlist(ALICE, []);
    expect(alice).toEqual([{ market: "crypto", symbol: "bitcoin" }, { market: "stocks", symbol: "aapl" }]);
    await expect(asRole("authenticated", ALICE, tx => tx.query("insert into public.watchlists(user_id,market,symbol) values($1,'crypto','spoofed')", [BOB]))).rejects.toMatchObject({ code: "42501" });
  });
  it("rejects anonymous access, invalid keys, non-arrays and oversized batches", async () => {
    await expect(asRole("anon", null, tx => tx.query("select * from public.sync_watchlist('[]'::jsonb)"))).rejects.toMatchObject({ code: "42501" });
    for (const invalid of [null, "crypto:bitcoin", [123], ["unknown:bitcoin"], ["crypto:bad:key"], Array.from({ length: 101 }, (_, i) => `crypto:coin${i}`)]) {
      await expect(syncWatchlist(ALICE, invalid)).rejects.toMatchObject({ code: "22023" });
    }
    expect((await db.query("select * from public.watchlists")).rows).toEqual([]);
  });
});
