import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: mocks.auth }));
import { PATCH, DELETE } from "../src/app/api/posts/[id]/route";
import { POST } from "../src/app/api/posts/route";
const id = "3d6ec114-c607-40e0-a844-d0fbf0197562";
const site = "https://marketwise.bynevin.dev";
type Row = { id: string; author_id: string; title: string; body: string; published: boolean };
function database(rows: Row[]) {
  return { from: vi.fn(() => {
    const predicates: [string, unknown][] = []; let update: Partial<Row> | null = null; let deleting = false;
    const query = {
      update(value: Partial<Row>) { update = value; return query; }, delete() { deleting = true; return query; },
      eq(column: string, value: unknown) { predicates.push([column, value]); return query; }, select() { return query; },
      async maybeSingle() { const row = rows.find(item => predicates.every(([key, value]) => item[key as keyof Row] === value)); if (!row) return { data: null, error: null }; if (update) Object.assign(row, update); if (deleting) rows.splice(rows.indexOf(row), 1); return { data: { ...row }, error: null }; },
    }; return query;
  }) };
}
function request(method: string, body?: unknown) { return new Request(`${site}/api/posts/${id}`, { method, headers: { Origin: site, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }); }
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SITE_URL", site); mocks.auth.mockReset(); });
afterEach(() => { vi.unstubAllEnvs(); });
describe("account content authorization", () => {
  it("does not update or delete another account's post even with a known ID", async () => {
    const rows: Row[] = [{ id, author_id: "victim", title: "Original", body: "Private", published: false }];
    mocks.auth.mockResolvedValue({ user: { id: "attacker" }, supabase: database(rows) });
    const patched = await PATCH(request("PATCH", { title: "Changed", body: "Injected", published: true }), { params: Promise.resolve({ id }) });
    expect(patched.status).toBe(404); expect(rows[0].title).toBe("Original");
    const deleted = await DELETE(request("DELETE"), { params: Promise.resolve({ id }) });
    expect(deleted.status).toBe(404); expect(rows).toHaveLength(1);
  });
  it("lets the verified author update their own content", async () => {
    const rows: Row[] = [{ id, author_id: "owner", title: "Original", body: "Private", published: false }];
    mocks.auth.mockResolvedValue({ user: { id: "owner" }, supabase: database(rows) });
    const response = await PATCH(request("PATCH", { title: "Updated", body: "New perspective", published: true }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200); expect(rows[0]).toMatchObject({ author_id: "owner", title: "Updated", published: true });
  });
  it("rejects anonymous mutations and unconfigured services without success", async () => {
    mocks.auth.mockResolvedValue({ user: null, supabase: database([]) });
    expect((await DELETE(request("DELETE"), { params: Promise.resolve({ id }) })).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: null, supabase: null });
    expect((await POST(request("POST", { title: "View", body: "Reasoning" })) ).status).toBe(503);
  });
  it("rejects forged author fields before touching storage", async () => {
    const db = database([]); mocks.auth.mockResolvedValue({ user: { id: "owner" }, supabase: db });
    const response = await POST(request("POST", { title: "View", body: "Reasoning", author_id: "victim" }));
    expect(response.status).toBe(400); expect(db.from).not.toHaveBeenCalled();
  });
});
