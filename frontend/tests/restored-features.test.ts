import { describe, expect, it } from "vitest";
import { parseHeadlines } from "../src/lib/news";
import { chartSymbol } from "../src/lib/symbols";
import { helpAnswer } from "../src/lib/help";
describe("publisher data safety", () => {
  it("extracts attributed, linked headlines and preserves the source date", () => {
    const xml = '<rss><channel><item><title><![CDATA[Markets & context]]></title><link>https://publisher.example/story</link><pubDate>Fri, 13 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>';
    expect(parseHeadlines(xml, "Publisher")).toEqual([{ title: "Markets & context", url: "https://publisher.example/story", source: "Publisher", published: "2026-11-13T10:00:00.000Z" }]);
  });
  it("rejects executable or credential-bearing links", () => {
    for (const link of ["javascript:alert(1)", "http://insecure.example/", "https://user:password@example.com/"]) expect(parseHeadlines(`<rss><channel><item><title>Title</title><link>${link}</link></item></channel></rss>`, "Publisher")).toEqual([]);
  });
  it("rejects entity declarations and oversized feeds", () => {
    expect(parseHeadlines('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>', "Publisher")).toEqual([]);
    expect(parseHeadlines("x".repeat(1_000_001), "Publisher")).toEqual([]);
  });
  it("leaves missing dates empty instead of inventing freshness", () => {
    expect(parseHeadlines('<rss><channel><item><title>Title</title><link>https://example.com/story</link></item></channel></rss>', "Source")[0].published).toBeNull();
  });
});
describe("old chart bookmarks", () => {
  it("accepts the original ticker and named coin links plus explicit equity markets", () => {
    expect(chartSymbol("BTC")).toBe("BINANCE:BTCUSDT");
    expect(chartSymbol("bitcoin")).toBe("BINANCE:BTCUSDT");
    expect(chartSymbol("NASDAQ:AAPL")).toBe("NASDAQ:AAPL");
    expect(chartSymbol("FX_IDC:USDINR")).toBe("FX_IDC:USDINR");
  });
  it.each(["<script>", "https://evil.example", "BTC\"}", "BTC\nETH", ""])("rejects malformed chart identifiers %j", value => expect(chartSymbol(value)).toBeNull());
});
describe("restored help", () => {
  it("does not classify 'this' as a greeting because it contains 'hi'", () => {
    expect(helpAnswer("how does this simulator work").href).toBe("/simulator");
  });
  it("does not claim accounts and paid plans are enabled", () => {
    expect(helpAnswer("subscription plans").answer).toContain("not available yet");
  });
});
