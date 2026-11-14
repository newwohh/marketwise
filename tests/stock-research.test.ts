import { afterEach, describe, expect, it, vi } from "vitest";
import { getStockResearch, parseDividends } from "../src/lib/stock-research";
import { legacyRedirects } from "../src/lib/navigation";
afterEach(() => vi.unstubAllEnvs());
const now = new Date("2026-11-15T00:00:00Z");
describe("configured dividend calendar", () => {
  it("keeps the unconfigured calendar empty instead of inventing payouts", async () => {
    vi.stubEnv("FINNHUB_API_KEY", ""); const request = vi.fn();
    const data = await getStockResearch(request, now);
    expect(data.dividendStatus).toBe("unconfigured"); expect(data.dividends).toEqual([]); expect(request).not.toHaveBeenCalled();
    expect(data.exchanges.some(exchange => exchange.mic === "XNSE")).toBe(true);
  });
  it("uses fixed symbols, bounded dates and a header credential", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-secret");
    const request = vi.fn().mockImplementation(async (url: string) => new Response(JSON.stringify([{ symbol: new URL(url).searchParams.get("symbol"), amount: 1.25, date: "2026-11-01", currency: "USD", payDate: "2026-11-20" }])));
    const data = await getStockResearch(request, now);
    expect(data.dividendStatus).toBe("available"); expect(data.dividends).toHaveLength(6);
    expect(data.dividends[0]).toMatchObject({ amount: 1.25, currency: "USD", exDate: "2026-11-01", payDate: "2026-11-20", declarationDate: null });
    for (const [url, options] of request.mock.calls) { const parsed = new URL(url); expect(parsed.hostname).toBe("finnhub.io"); expect(parsed.searchParams.get("from")).toBe(data.from); expect(parsed.searchParams.get("to")).toBe(data.to); expect(url).not.toContain("test-secret"); expect(options.headers["X-Finnhub-Token"]).toBe("test-secret"); }
  });
  it("reports provider-plan denials without replacing them with stale examples", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-secret"); const request = vi.fn().mockImplementation(async () => new Response("not authorized", { status: 403 }));
    const data = await getStockResearch(request, now);
    expect(data.dividendStatus).toBe("unavailable"); expect(data.dividends).toEqual([]); expect(data.unavailableSymbols).toHaveLength(6);
  });
  it("distinguishes a legitimate empty provider calendar from an outage", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-secret"); const request = vi.fn().mockImplementation(async () => new Response("[]"));
    const data = await getStockResearch(request, now); expect(data.dividendStatus).toBe("available"); expect(data.dividends).toEqual([]);
  });
  it("rejects invalid dates, mismatched symbols and rows outside the requested window", () => {
    expect(parseDividends([{ amount: 1, date: "2026-02-31" }], "AAPL", "2026-01-01", "2026-12-31")).toBeNull();
    expect(parseDividends([{ symbol: "MSFT", amount: 1, date: "2026-11-01" }, { amount: 1, date: "2025-11-01" }], "AAPL", "2026-01-01", "2026-12-31")).toEqual([]);
  });
  it("does not infer payout currency or payment dates", () => {
    expect(parseDividends([{ amount: 1, date: "2026-11-01" }], "AAPL", "2026-01-01", "2026-12-31")).toEqual([{ symbol: "AAPL", amount: 1, exDate: "2026-11-01", currency: null, payDate: null, declarationDate: null }]);
  });
});
it("retains historical typo and unparameterized chart bookmarks", () => {
  expect(legacyRedirects).toContainEqual({ source: "/user_protecttion", destination: "/user_protection", permanent: true });
  expect(legacyRedirects).toContainEqual({ source: "/cryptocurrency/chart", destination: "/cryptocurrency/chart/BTC", permanent: true });
});
