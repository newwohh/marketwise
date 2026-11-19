import { describe, expect, it } from "vitest";
import { postInput, publicAuthorName, watchlistInput, watchlistRows } from "../src/lib/posts-contract";
import { contentJson, requireContentOrigin } from "../src/lib/posts-http";
describe("published field note input", () => {
  it("refuses caller-selected ownership and extra fields", () => {
    expect(postInput.safeParse({ title: "View", body: "Reasoning", author_id: "someone-else" }).success).toBe(false);
    expect(postInput.safeParse({ title: "View", body: "Reasoning", id: "overwrite" }).success).toBe(false);
  });
  it("requires bounded non-empty content and explicit public state", () => {
    expect(postInput.parse({ title: "  View  ", body: "  Reasoning  " })).toEqual({ title: "View", body: "Reasoning", published: false });
    expect(postInput.safeParse({ title: " ", body: "Reasoning" }).success).toBe(false);
    expect(postInput.safeParse({ title: "View", body: "x".repeat(50001) }).success).toBe(false);
    expect(postInput.safeParse({ title: "View", body: "Reasoning", published: "true" }).success).toBe(false);
  });
  it("snapshots only a bounded display name, never an email or supplied author id", () => {
    expect(publicAuthorName({ email: "private@example.com" })).toBe("Marketwise contributor");
    expect(publicAuthorName({ display_name: " a ".repeat(80) })).toHaveLength(80);
  });
});
describe("watchlist identities", () => {
  it("preserves the original market:id format and assigns identity server-side", () => {
    const items = watchlistInput.parse({ items: ["crypto:bitcoin", "stocks:aapl", "crypto:bitcoin"] });
    expect(watchlistRows(items.items, "verified-user")).toEqual([{ user_id: "verified-user", market: "crypto", symbol: "bitcoin" }, { user_id: "verified-user", market: "stocks", symbol: "aapl" }]);
  });
  it("rejects arbitrary market names, control characters and client-selected user ids", () => {
    for (const item of ["admin:bitcoin", "crypto:foo\nbar", "crypto:", "crypto:../user"]) expect(watchlistInput.safeParse({ items: [item] }).success).toBe(false);
    expect(watchlistInput.safeParse({ items: [], user_id: "victim" }).success).toBe(false);
    expect(watchlistInput.safeParse({ items: Array(101).fill("crypto:bitcoin") }).success).toBe(false);
  });
});
describe("content request boundary", () => {
  it("rejects a cross-origin mutation before accepting content", () => {
    expect(() => requireContentOrigin(new Request("https://marketwise.bynevin.dev/api/posts", { headers: { Origin: "https://attacker.example" } }))).toThrow();
    expect(() => requireContentOrigin(new Request("https://marketwise.bynevin.dev/api/posts", { headers: { Origin: "https://marketwise.bynevin.dev" } }))).not.toThrow();
  });
  it("requires JSON and rejects malformed or oversized request bodies", async () => {
    await expect(contentJson(new Request("https://example.com", { method: "POST", body: "not-json" }))).rejects.toMatchObject({ status: 415 });
    await expect(contentJson(new Request("https://example.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).rejects.toMatchObject({ status: 400 });
    await expect(contentJson(new Request("https://example.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: "x".repeat(220000) }) }))).rejects.toMatchObject({ status: 413 });
  });
});
