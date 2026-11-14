import { describe, expect, it, vi } from "vitest";
import { getMarkets } from "../src/lib/markets";
import { GET } from "../src/app/api/markets/route";
describe("provider behaviour", () => {
  it("labels a provider outage as illustrative data with no fabricated timestamp", async () => {
    const request = vi.fn().mockRejectedValue(new Error("rate limited"));
    const result = await getMarkets("crypto", request);
    expect(result.mode).toBe("demo"); expect(result.asOf).toBeNull();
    expect(result.note).toMatch(/not current quotes/);
  });
  it("rejects malformed provider prices", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: "bitcoin", current_price: "not a price" }])));
    expect((await getMarkets("crypto", request)).mode).toBe("demo");
  });
  it("does not fabricate forex price history, volume, or daily changes", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date: "2026-11-13", rates: { EUR: .92, INR: 83 } })));
    const result = await getMarkets("forex", request);
    expect(result.mode).toBe("live"); expect(result.asOf).toBe("2026-11-13T00:00:00Z");
    expect(result.quotes[0]).toMatchObject({ change: null, volume: null, marketCap: null, history: [] });
  });
  it("keeps stock previews explicit and does not call an unconfigured provider", async () => {
    const request = vi.fn(); expect((await getMarkets("stocks", request)).mode).toBe("demo"); expect(request).not.toHaveBeenCalled();
  });
  it("rejects unknown markets instead of letting callers choose upstream URLs", async () => {
    expect((await GET(new Request("http://localhost/api/markets?market=https://evil.example"))).status).toBe(400);
  });
});
