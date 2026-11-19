import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), requirePro: vi.fn(), markets: vi.fn(), customer: vi.fn(), live: vi.fn(), checkout: vi.fn(), price: vi.fn(), rpc: vi.fn(), list: vi.fn(), lineItems: vi.fn(), expire: vi.fn(), retrieve: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: mocks.auth }));
vi.mock("@/lib/markets", () => ({ getMarkets: mocks.markets }));
vi.mock("@/lib/billing", () => ({
  requirePro: mocks.requirePro, ensureCustomer: mocks.customer, liveSubscriptions: mocks.live,
  configuredPrices: () => ["price_allowed", "price_yearly"], billingSite: () => "https://marketwise.bynevin.dev",
  billingAdmin: () => ({ rpc: mocks.rpc }),
  createStripe: () => ({ prices: { retrieve: mocks.price }, checkout: { sessions: { create: mocks.checkout, list: mocks.list, listLineItems: mocks.lineItems, expire: mocks.expire, retrieve: mocks.retrieve } } }),
  safeBillingError: (error: { message?: string; status?: number }) => ({ error: error.message ?? "Unavailable", status: error.status ?? 503 }),
  BillingError: class extends Error { constructor(message: string, public status = 503) { super(message); } },
}));
import { GET as exportData } from "../src/app/api/export/route";
import { POST as checkout } from "../src/app/api/billing/checkout/route";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://marketwise.bynevin.dev"); vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_allowed"); vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly");
  let owner: string | null = null;
  mocks.rpc.mockImplementation(async (name: string, args: { p_token: string }) => {
    if (name === "acquire_billing_checkout") { if (owner) return { data: false, error: null }; owner = args.p_token; return { data: true, error: null }; }
    if (name === "renew_billing_checkout") return { data: args.p_token === owner, error: null };
    if (name === "release_billing_checkout") { const valid = args.p_token === owner; if (valid) owner = null; return { data: valid, error: null }; }
    return { data: null, error: new Error("Unexpected RPC") };
  });
  mocks.auth.mockResolvedValue({ user: { id: "verified-user", email: "member@example.test" }, supabase: {} });
  mocks.customer.mockResolvedValue("cus_verified"); mocks.live.mockResolvedValue({ subscriptions: [] }); mocks.price.mockResolvedValue({ active: true, recurring: { interval: "month" } });
  mocks.checkout.mockResolvedValue({ id: "cs_created", status: "open", url: "https://checkout.stripe.com/c/pay/test" });
  mocks.list.mockImplementation(() => ({ async *[Symbol.asyncIterator]() {} }));
  mocks.lineItems.mockResolvedValue({ data: [{ price: { id: "price_allowed" }, quantity: 1 }], has_more: false });
  mocks.expire.mockResolvedValue({ status: "expired" });
  mocks.requirePro.mockResolvedValue({ pro: true });
  mocks.markets.mockResolvedValue({ source: "Illustrative sample", mode: "demo", asOf: null, quotes: [{ symbol: "BTC", name: "Bitcoin", price: 100, change: -2, marketCap: 1000, volume: 500 }] });
});
afterEach(() => vi.unstubAllEnvs());
const request = (body: unknown, origin = "https://marketwise.bynevin.dev") => new Request("https://marketwise.bynevin.dev/api/billing/checkout", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
describe("checkout endpoint", () => {
  it("rejects cross-origin and unauthenticated checkout before touching Stripe", async () => {
    expect((await checkout(request({ interval: "monthly" }, "https://evil.example"))).status).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
    mocks.auth.mockResolvedValue({ user: null });
    expect((await checkout(request({ interval: "monthly" }))).status).toBe(401);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("uses the configured price and authenticated identity rather than client-supplied values", async () => {
    const response = await checkout(request({ interval: "monthly", price: "price_attacker", userId: "attacker", amount: 1 }));
    expect(response.status).toBe(200);
    const [payload, options] = mocks.checkout.mock.calls[0];
    expect(payload.line_items).toEqual([{ price: "price_allowed", quantity: 1 }]);
    expect(payload.client_reference_id).toBe("verified-user");
    expect(payload.customer).toBe("cus_verified");
    expect(options.idempotencyKey).toContain("verified-user-price_allowed");
  });
  it("directs existing subscribers to billing instead of creating a second plan", async () => {
    mocks.live.mockResolvedValue({ subscriptions: [{ status: "past_due" }] });
    expect((await checkout(request({ interval: "monthly" }))).status).toBe(409);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("does not accept arbitrary plan selectors", async () => {
    expect((await checkout(request({ interval: "attacker-price" }))).status).toBe(400);
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("serializes concurrent monthly and yearly requests before either can create a second live URL", async () => {
    const responses = await Promise.all([checkout(request({ interval: "monthly" })), checkout(request({ interval: "yearly" }))]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(mocks.checkout).toHaveBeenCalledTimes(1);
    expect(mocks.price).toHaveBeenCalledTimes(1);
    expect(mocks.rpc.mock.calls.filter(([name]) => name === "release_billing_checkout")).toHaveLength(1);
  });
  it("reuses an owned open same-price checkout instead of creating another", async () => {
    const open = { id: "cs_existing", mode: "subscription", status: "open", customer: "cus_verified", client_reference_id: "verified-user", metadata: { marketwise_user_id: "verified-user" }, url: "https://checkout.stripe.com/c/pay/existing" };
    mocks.list.mockImplementation(() => ({ async *[Symbol.asyncIterator]() { yield open; } }));
    mocks.retrieve.mockResolvedValue(open);
    const response = await checkout(request({ interval: "monthly" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: open.url });
    expect(mocks.checkout).not.toHaveBeenCalled(); expect(mocks.expire).not.toHaveBeenCalled();
  });
  it("expires other open prices before creating a changed-plan checkout", async () => {
    const open = { id: "cs_monthly", mode: "subscription", status: "open", customer: "cus_verified", client_reference_id: "verified-user", metadata: { marketwise_user_id: "verified-user" }, url: "https://checkout.stripe.com/c/pay/monthly" };
    mocks.list.mockImplementation(() => ({ async *[Symbol.asyncIterator]() { yield open; } }));
    const response = await checkout(request({ interval: "yearly" }));
    expect(response.status).toBe(200);
    expect(mocks.expire).toHaveBeenCalledWith("cs_monthly");
    expect(mocks.expire.mock.invocationCallOrder[0]).toBeLessThan(mocks.checkout.mock.invocationCallOrder[0]);
    expect(mocks.checkout.mock.calls[0][1].idempotencyKey).toContain("price_yearly-cs_monthly");
  });
  it("closes duplicate same-price URLs before reusing one", async () => {
    const open = (id: string) => ({ id, mode: "subscription", status: "open", customer: "cus_verified", client_reference_id: "verified-user", metadata: { marketwise_user_id: "verified-user" }, url: `https://checkout.stripe.com/c/pay/${id}` });
    mocks.list.mockImplementation(() => ({ async *[Symbol.asyncIterator]() { yield open("cs_newer"); yield open("cs_older"); } }));
    mocks.retrieve.mockResolvedValue(open("cs_newer"));
    expect((await checkout(request({ interval: "monthly" }))).status).toBe(200);
    expect(mocks.expire).toHaveBeenCalledExactlyOnceWith("cs_older");
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("refuses unknown ownership, expiration races and lost lease renewals", async () => {
    const open = { id: "cs_unknown", mode: "subscription", status: "open", customer: "cus_verified", client_reference_id: "other-user", metadata: { marketwise_user_id: "other-user" }, url: "https://checkout.stripe.com/c/pay/unknown" };
    mocks.list.mockImplementation(() => ({ async *[Symbol.asyncIterator]() { yield open; } }));
    expect((await checkout(request({ interval: "yearly" }))).status).toBe(409);
    expect(mocks.expire).not.toHaveBeenCalled(); expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("fails closed on acquisition or release errors", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "Database unavailable" } });
    expect((await checkout(request({ interval: "monthly" }))).status).toBe(503);
    expect(mocks.checkout).not.toHaveBeenCalled();
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name !== "release_billing_checkout", error: name === "release_billing_checkout" ? { message: "Unavailable" } : null }));
    const response = await checkout(request({ interval: "monthly" }));
    expect(response.status).toBe(503); expect(await response.json()).not.toHaveProperty("url");
  });
  it("keeps retries idempotent across old time-bucket boundaries while history is unchanged", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-15T00:14:59Z"));
      expect((await checkout(request({ interval: "monthly" }))).status).toBe(200);
      vi.setSystemTime(new Date("2026-11-15T00:15:01Z"));
      expect((await checkout(request({ interval: "monthly" }))).status).toBe(200);
      expect(mocks.checkout.mock.calls[0][1].idempotencyKey).toBe(mocks.checkout.mock.calls[1][1].idempotencyKey);
    } finally { vi.useRealTimers(); }
  });
});
describe("paid export endpoint", () => {
  it("does not fetch or expose market data to unsigned or unpaid callers", async () => {
    mocks.auth.mockResolvedValueOnce({ user: null });
    expect((await exportData(new Request("https://example.test/api/export"))).status).toBe(401);
    mocks.requirePro.mockRejectedValueOnce({ message: "Pro required", status: 403 });
    expect((await exportData(new Request("https://example.test/api/export"))).status).toBe(403);
    expect(mocks.markets).not.toHaveBeenCalled();
  });
  it("exports source and demo labels for an authenticated paid user", async () => {
    const response = await exportData(new Request("https://example.test/api/export?market=crypto"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await response.text();
    expect(body).toContain('"Illustrative sample","demo"'); expect(body).toContain('"-2"');
    expect(mocks.requirePro).toHaveBeenCalledWith("verified-user");
  });
});
