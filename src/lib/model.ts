// Shared market contracts and pure calculations; demo quotes never masquerade as live prices.
export type Market = "crypto" | "stocks" | "forex";
export type Quote = {
  id: string; symbol: string; name: string; price: number; change: number | null; change7d?: number | null;
  marketCap: number | null; volume: number | null; history: number[]; color: string;
};
export type MarketData = {
  quotes: Quote[]; mode: "live" | "demo"; source: string; asOf: string | null; note: string;
};
export function money(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 2 : value < 1 ? 4 : 2 }).format(value);
}
export function quotePrice(quote: Quote, market: Market) {
  return market === "forex" ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(quote.price)} ${quote.symbol.split("/")[1] ?? ""}` : money(quote.price);
}
export function projectInvestment(initial: number, monthly: number, years: number, annualRate: number) {
  if (![initial, monthly, years, annualRate].every(Number.isFinite) || initial < 0 || monthly < 0 || years < 1 || years > 50 || !Number.isInteger(years) || annualRate <= -100 || annualRate > 100) throw new Error("Enter valid amounts, 1–50 whole years, and a return above -100% and at most 100%.");
  const rate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  let value = initial;
  const points = [initial];
  for (let month = 1; month <= years * 12; month++) {
    value = value * (1 + rate) + monthly;
    if (!Number.isFinite(value)) throw new Error("These amounts exceed the simulator’s supported range. Use smaller values.");
    if (month % 12 === 0) points.push(value);
  }
  const contributed = initial + monthly * years * 12;
  if (!Number.isFinite(contributed)) throw new Error("These contributions exceed the simulator’s supported range. Use smaller values.");
  return { value, contributed, gain: value - contributed, points };
}
export function hasPro(subscription: { status: string; current_period_end: string | null } | null, now = Date.now()) {
  return !!subscription && ["active", "trialing"].includes(subscription.status) && !!subscription.current_period_end && Date.parse(subscription.current_period_end) > now;
}
export function safeNext(next: string | null) {
  return next && /^\/(?!\/|\\)/.test(next) && !/[\\\r\n]/.test(next) ? next : "/account";
}
