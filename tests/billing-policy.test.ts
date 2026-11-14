import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { csvCell, formatStripeAmount, subscriptionAccess, subscriptionPeriodEnd, trustedBillingOrigin, type BillingSubscription } from "../src/lib/billing-policy";
import { verifyBillingWebhook } from "../src/lib/billing-webhook";
const now = Date.parse("2026-11-15T00:00:00Z");
const future = now / 1000 + 86400;
function subscription(status = "active", price = "price_pro", end = future): BillingSubscription { return { id: "sub_test", status, items: { data: [{ price: { id: price }, current_period_end: end }] } }; }
describe("server-side subscription policy", () => {
  it("requires an allowed plan and a current active/trial period", () => {
    expect(subscriptionAccess(subscription(), ["price_pro"], now)).toBe(true);
    expect(subscriptionAccess(subscription("trialing"), ["price_pro"], now)).toBe(true);
    for (const status of ["canceled", "past_due", "unpaid", "paused", "incomplete", "incomplete_expired"]) expect(subscriptionAccess(subscription(status), ["price_pro"], now)).toBe(false);
  });
  it("does not accept someone else's active product or an expired/missing period", () => {
    expect(subscriptionAccess(subscription("active", "price_other"), ["price_pro"], now)).toBe(false);
    expect(subscriptionAccess(subscription("active", "price_pro", now / 1000), ["price_pro"], now)).toBe(false);
    expect(subscriptionAccess(subscription("active", "price_pro", NaN), ["price_pro"], now)).toBe(false);
    expect(subscriptionAccess(subscription(), [], now)).toBe(false);
  });
  it("checks the matching price's period, not a different item's longer period", () => {
    const s = subscription("active", "price_pro", 1); s.items.data.push({ price: { id: "price_other" }, current_period_end: future });
    expect(subscriptionAccess(s, ["price_pro"], now)).toBe(false);
    expect(subscriptionPeriodEnd(s, ["price_pro"])).toBe("1970-01-01T00:00:01.000Z");
  });
});
describe("checkout request origins", () => {
  it("accepts only the exact configured origin", () => {
    const request = (origin?: string) => new Request("https://marketwise.bynevin.dev/api/billing/checkout", { method: "POST", headers: origin ? { origin } : {} });
    expect(trustedBillingOrigin(request("https://marketwise.bynevin.dev"), "https://marketwise.bynevin.dev")).toBe(true);
    expect(trustedBillingOrigin(request("https://evil.example"), "https://marketwise.bynevin.dev")).toBe(false);
    expect(trustedBillingOrigin(request(), "https://marketwise.bynevin.dev")).toBe(false);
    expect(trustedBillingOrigin(request("https://marketwise.bynevin.dev"))).toBe(false);
  });
});
describe("real Stripe webhook signature verification", () => {
  const secret = "whsec_unit_test_only";
  const payload = JSON.stringify({ id: "evt_test", object: "event", type: "customer.subscription.updated", created: Math.floor(Date.now() / 1000), data: { object: { id: "sub_test" } } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  it("accepts a correctly signed payload", () => expect(verifyBillingWebhook(payload, header, secret).id).toBe("evt_test"));
  it("rejects modified payloads and signatures", () => {
    expect(() => verifyBillingWebhook(payload + " ", header, secret)).toThrow();
    expect(() => verifyBillingWebhook(payload, header, "wrong-secret")).toThrow();
    const stale = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 600 });
    expect(() => verifyBillingWebhook(payload, stale, secret)).toThrow();
  });
});
describe("export and price formatting", () => {
  it("quotes CSV and neutralizes spreadsheet formulas without changing numeric losses", () => {
    expect(csvCell('An "asset"')).toBe('"An ""asset"""');
    expect(csvCell("=WEBSERVICE(\"url\")")).toContain("'=WEBSERVICE");
    expect(csvCell(-2.5)).toBe('"-2.5"');
  });
  it("uses the actual minor-unit exponent", () => {
    expect(formatStripeAmount(1499, "usd")).toBe("$14.99");
    expect(formatStripeAmount(1500, "jpy")).toContain("1,500");
    expect(formatStripeAmount(1500, "kwd")).toContain("1.500");
  });
});
