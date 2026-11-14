import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: mocks.auth }));
import { GET, POST } from "../src/app/api/watchlist/route";
const site = "https://marketwise.bynevin.dev";
type Row = { market: string; symbol: string };
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SITE_URL", site); mocks.auth.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
describe("cloud watchlist capacity API", () => {
  it("uses the transactional RPC result when an account already has 100 assets", async () => {
    // Database integration tests execute the migration. This response fixture is
    // the RPC's authoritative retained snapshot: oldest evicted, new last.
    const retained: Row[] = [...Array.from({ length: 99 }, (_, i) => ({ market: "crypto", symbol: `asset${i + 1}` })), { market: "crypto", symbol: "newasset" }];
    const rpc = vi.fn().mockResolvedValue({ data: retained, error: null });
    const directTable = vi.fn(() => { throw new Error("Sync must not use a separate read/upsert/prune sequence"); });
    mocks.auth.mockResolvedValue({ user: { id: "verified-account" }, supabase: { rpc, from: directTable } });
    const response = await POST(new Request(`${site}/api/watchlist`, { method: "POST", headers: { Origin: site, "Content-Type": "application/json" }, body: JSON.stringify({ items: ["crypto:newasset"] }) }));
    const body = await response.json();
    expect(response.status).toBe(200); expect(body.items).toHaveLength(100);
    expect(body.items).not.toContain("crypto:asset0"); expect(body.items.at(-1)).toBe("crypto:newasset");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("sync_watchlist", { p_items: ["crypto:newasset"] });
    expect(directTable).not.toHaveBeenCalled();
  });
  it("passes only keys to the RPC; client identity cannot replace auth.uid", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.auth.mockResolvedValue({ user: { id: "verified-account" }, supabase: { rpc } });
    const response = await POST(new Request(`${site}/api/watchlist`, { method: "POST", headers: { Origin: site, "Content-Type": "application/json" }, body: JSON.stringify({ items: [], user_id: "victim" }) }));
    expect(response.status).toBe(400); expect(rpc).not.toHaveBeenCalled();
  });
  it("reads the newest capped window then returns chronological order", async () => {
    const order = vi.fn(); const filter = vi.fn();
    const query = { select() { return query; }, eq(column: string, value: string) { filter(column, value); return query; }, order(column: string, options: unknown) { order(column, options); return query; }, limit: vi.fn().mockResolvedValue({ data: [{ market: "crypto", symbol: "newasset" }, { market: "crypto", symbol: "older" }], error: null }) };
    mocks.auth.mockResolvedValue({ user: { id: "verified-account" }, supabase: { from: () => query } });
    const response = await GET();
    expect((await response.json()).items).toEqual(["crypto:older", "crypto:newasset"]);
    expect(filter).toHaveBeenCalledWith("user_id", "verified-account");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(100);
  });
  it("never reports a successful sync when the RPC fails", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "verified-account" }, supabase: { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error("missing migration") }) } });
    const response = await POST(new Request(`${site}/api/watchlist`, { method: "POST", headers: { Origin: site, "Content-Type": "application/json" }, body: JSON.stringify({ items: ["crypto:bitcoin"] }) }));
    expect(response.status).toBe(503); expect((await response.json()).items).toBeUndefined();
  });
});
