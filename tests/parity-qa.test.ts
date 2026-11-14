// Regression checks derived from the old route contract and malformed provider/math inputs.
// These deliberately test acceptance boundaries, not a copy of the new implementation.
import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { projectInvestment } from "../src/lib/model";
import { getMarkets } from "../src/lib/markets";
import { legacyRedirects } from "../src/lib/navigation";

afterEach(() => { vi.unstubAllEnvs(); });

describe("legacy public route contract", () => {
  const originalRoutes = fileURLToPath(new URL("../../marketwise-original/src/routes/AppRoutes.jsx", import.meta.url));
  it("retains every original public path as a real route or explicit compatibility redirect", () => {
    // Keep the test useful in the new GitHub repository, where the old checkout is absent.
    const paths = existsSync(originalRoutes)
      ? [...readFileSync(originalRoutes, "utf8").matchAll(/<Route\s+(?:exact\s+)?path="([^"]+)"/g)].map(match => match[1])
      : ["/", "profile", "/sign-up", "login", "/subscription", "/education", "/grow", "/explore", "/user_protection", "/about", "/cryptocurrency", "chart/:id", "/stocks", "/heatmap/cryptocurrency", "/heatmap/stocks", "/blogs", "/investsimulator", "/faq", "/chat"];
    const missing = paths.filter(raw => {
      const path = raw.startsWith("/") ? raw : `/${raw}`;
      if (legacyRedirects.some(redirect => redirect.source === path)) return false;
      const appPath = path === "/chart/:id" ? "cryptocurrency/chart/[id]" : path.startsWith("/heatmap/") ? "heatmap/[market]" : path.replace(/^\//, "");
      return !existsSync(fileURLToPath(new URL(`../src/app/${appPath ? appPath + "/" : ""}page.tsx`, import.meta.url)));
    });
    expect(missing).toEqual([]);
  });
});

describe("simulator resilience", () => {
  it("rejects a finite input whose compounding would overflow instead of displaying infinity", () => {
    expect(() => projectInvestment(1e308, 0, 50, 100)).toThrow();
  });
  it("rejects contribution overflow instead of returning an infinite portfolio", () => {
    expect(() => projectInvestment(0, 1e308, 50, 0)).toThrow();
  });
  it("keeps a zero starting amount and zero contribution valid", () => {
    expect(projectInvestment(0, 0, 1, 0)).toEqual({ value: 0, contributed: 0, gain: 0, points: [0, 0] });
  });
  it("models negative returns with end-of-month additions rather than replacing them with a positive default", () => {
    const result = projectInvestment(1000, 100, 1, -10);
    const rate = .9 ** (1 / 12) - 1;
    expect(result.value).toBeCloseTo(1000 * .9 + 100 * (((1 + rate) ** 12 - 1) / rate), 6);
    expect(result.gain).toBeLessThan(0);
  });
});

describe("currency provider validation", () => {
  it("does not call an empty rates response live data", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date: "2026-11-13", rates: {} })));
    expect((await getMarkets("forex", request)).mode).toBe("demo");
  });
  it.each(["2026-99-99", "2026-02-31", "2025-02-29"])("rejects the invalid calendar date %s", async date => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date, rates: { EUR: .9 } })));
    expect((await getMarkets("forex", request)).mode).toBe("demo");
  });
  it("keeps leap-day reference data valid", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ date: "2024-02-29", rates: { EUR: .9 } })));
    const data = await getMarkets("forex", request);
    expect(data.mode).toBe("live");
    expect(data.asOf).toBe("2024-02-29T00:00:00Z");
    expect(data.quotes[0]).toMatchObject({ history: [], change: null, volume: null });
  });
});
