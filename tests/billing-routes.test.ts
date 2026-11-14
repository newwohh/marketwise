import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), requirePro: vi.fn(), markets: vi.fn(), customer: vi.fn(), live: vi.fn(), checkout: vi.fn(), price: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: mocks.auth }));
vi.mock("@/lib/markets", () => ({ getMarkets: mocks.markets }));
vi.mock("@/lib/billing", () => ({
  requirePro: mocks.requirePro, ensureCustomer: mocks.customer, liveSubscriptions: mocks.live,
  configuredPrices: () => ["price_allowed"], billingSite: () => "https://marketwise.bynevin.dev",
  createStripe: () => ({ prices: { retrieve: mocks.price }, checkout: { sessions: { create: mocks.checkout } } }),
  safeBillingError: (error: { message?: string; status?: number }) => ({ error: error.message ?? "Unavailable", status: error.status ?? 503 }),
  BillingError: class extends Error { constructor(message: string, public status = 503) { super(message); } },
}));
import { GET as exportData } from "../src/app/api/export/route";
import { POST as checkout } from "../src/app/api/billing/checkout/route";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://marketwise.bynevin.dev"); vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_allowed");
  mocks.auth.mockResolvedValue({ user: { id: "verified-user", email: "member@example.test" }, supabase: {} });
  mocks.customer.mockResolvedValue("cus_verified"); mocks.live.mockResolvedValue({ subscriptions: [] }); mocks.price.mockResolvedValue({ active: true, recurring: { interval: "month" } });
  mocks.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/test" });
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
