import { afterEach, expect, it, vi } from "vitest";
import { getMarkets } from "../src/lib/markets";
afterEach(() => vi.unstubAllEnvs());
it("uses configured stock quotes without exposing the API key in request URLs", async () => {
  vi.stubEnv("FINNHUB_API_KEY", "test-key");
  const request = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ c: 100, dp: 2, t: 1794690000 })));
  const data = await getMarkets("stocks", request);
  expect(data.mode).toBe("live"); expect(data.source).toBe("Finnhub"); expect(data.quotes).toHaveLength(6);
  expect(data.quotes[0]).toMatchObject({ symbol: "AAPL", price: 100, change: 2, history: [], volume: null, marketCap: null });
  for (const [url, options] of request.mock.calls) { expect(url).not.toContain("test-key"); expect(options.headers).toEqual({ "X-Finnhub-Token": "test-key" }); }
});
it("discloses partial quote outages instead of substituting invented values", async () => {
  vi.stubEnv("FINNHUB_API_KEY", "test-key");
  const request = vi.fn().mockResolvedValue(new Response("unavailable", { status: 429 })).mockResolvedValueOnce(new Response(JSON.stringify({ c: 100, dp: -1, t: 1794690000 })));
  const data = await getMarkets("stocks", request);
  expect(data.mode).toBe("live"); expect(data.quotes).toHaveLength(1); expect(data.note).toContain("temporarily unavailable");
});
it("keeps unconfigured stock data explicitly illustrative", async () => {
  vi.stubEnv("FINNHUB_API_KEY", ""); const request = vi.fn();
  expect((await getMarkets("stocks", request)).mode).toBe("demo"); expect(request).not.toHaveBeenCalled();
});
