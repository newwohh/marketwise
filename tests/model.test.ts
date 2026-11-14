import { describe, expect, it } from "vitest";
import { hasPro, projectInvestment, quotePrice, safeNext } from "../src/lib/model";
import { demoQuotes } from "../src/lib/demo";
it("formats currency pairs in the quote currency rather than as US dollars", () => {
  expect(quotePrice(demoQuotes.forex[2], "forex")).toBe("83.42 INR");
});
describe("investment model", () => {
  it("preserves zero returns and adds monthly contributions without a default override", () => {
    expect(projectInvestment(1000, 100, 2, 0)).toMatchObject({ value: 3400, contributed: 3400, gain: 0 });
  });
  it("converts an effective annual return to a monthly rate", () => {
    expect(projectInvestment(10000, 0, 10, 7).value).toBeCloseTo(10000 * 1.07 ** 10, 6);
  });
  it("adds contributions at the end of the month", () => {
    const monthlyRate = 1.12 ** (1 / 12) - 1;
    expect(projectInvestment(0, 100, 1, 12).value).toBeCloseTo(100 * ((1 + monthlyRate) ** 12 - 1) / monthlyRate, 6);
  });
  it("supports losses", () => {
    expect(projectInvestment(1000, 0, 2, -10).value).toBeCloseTo(810);
  });
  it.each([[NaN, 0, 1, 7], [100, -1, 1, 7], [100, 0, 0, 7], [100, 0, 2.5, 7], [100, 0, 51, 7], [100, 0, 10, -100], [Infinity, 0, 10, 7]])("rejects invalid inputs %j", (...args) => {
    expect(() => projectInvestment(...args as [number, number, number, number])).toThrow();
  });
});
describe("subscription entitlement", () => {
  const now = Date.parse("2026-11-15T00:00:00Z");
  it("requires a current paid or trial subscription", () => {
    expect(hasPro({ status: "active", current_period_end: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(hasPro({ status: "trialing", current_period_end: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(hasPro({ status: "past_due", current_period_end: "2026-12-01T00:00:00Z" }, now)).toBe(false);
    expect(hasPro({ status: "active", current_period_end: "2026-11-01T00:00:00Z" }, now)).toBe(false);
    expect(hasPro(null, now)).toBe(false);
  });
});
describe("redirect target", () => {
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/x\r\nLocation: evil", null])("rejects external or ambiguous target %j", target => expect(safeNext(target)).toBe("/account"));
  it("allows a local page", () => expect(safeNext("/account/password")).toBe("/account/password"));
});
