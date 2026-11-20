// Pure billing policy shared by server handlers and tests. A status alone never
// grants Pro: the subscription must include a configured price in a current period.
export type BillingSubscription = {
  id: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items: { data: { price: { id: string }; current_period_end?: number }[] };
};

export function subscriptionAccess(subscription: BillingSubscription, prices: string[], now = Date.now()) {
  if (!["active", "trialing"].includes(subscription.status)) return false;
  return subscription.items.data.some(item => prices.includes(item.price.id) &&
    Number.isFinite(item.current_period_end ?? subscription.current_period_end) &&
    (item.current_period_end ?? subscription.current_period_end ?? 0) * 1000 > now);
}

export function subscriptionPeriodEnd(subscription: BillingSubscription, prices: string[]) {
  const periods = subscription.items.data.filter(item => prices.includes(item.price.id))
    .map(item => item.current_period_end ?? subscription.current_period_end ?? 0)
    .filter(value => Number.isFinite(value) && value > 0);
  return periods.length ? new Date(Math.max(...periods) * 1000).toISOString() : null;
}

export function csvCell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  // Spreadsheet consumers must not interpret asset/provider text as a formula.
  const safe = /^[\s]*[=+\-@]/.test(raw) && typeof value !== "number" ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function trustedBillingOrigin(request: Request, configuredUrl?: string) {
  if (!configuredUrl) return false;
  try {
    const site = new URL(configuredUrl);
    if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) return false;
    return request.headers.get("origin") === site.origin;
  } catch { return false; }
}

export function formatStripeAmount(amount: number, currency: string) {
  const code = currency.toUpperCase();
  const format = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
  // Stripe keeps two-decimal backwards compatibility for ISK and UGX charges.
  const digits = ["ISK", "UGX"].includes(code) ? 2 : format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(amount / 10 ** digits);
}
