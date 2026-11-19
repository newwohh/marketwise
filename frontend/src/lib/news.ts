// Publisher RSS headlines only. No copied credentials, invented news, or full article reproduction.
import { XMLParser } from "fast-xml-parser";
export type Headline = { title: string; url: string; source: string; published: string | null };
const feeds = [{ url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", category: "crypto" }, { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", source: "MarketWatch", category: "stocks" }] as const;
export function parseHeadlines(xml: string, source: string): Headline[] {
  if (xml.length > 1_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) return [];
  const document = new XMLParser({ ignoreAttributes: true, parseTagValue: false, processEntities: false, removeNSPrefix: true }).parse(xml);
  const raw = document?.rss?.channel?.item;
  const items: unknown[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.flatMap(item => {
    if (typeof item !== "object" || !item) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.link !== "string") return [];
    try {
      const url = new URL(row.link);
      if (url.protocol !== "https:" || url.username || url.password) return [];
      const date = typeof row.pubDate === "string" ? Date.parse(row.pubDate) : NaN;
      const title = row.title.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").slice(0, 250);
      return title.trim() ? [{ title, url: url.href, source, published: Number.isFinite(date) ? new Date(date).toISOString() : null }] : [];
    } catch { return []; }
  }).slice(0, 8);
}
export async function getNews(category?: string) {
  const results = await Promise.all(feeds.filter(feed => !category || feed.category === category).map(async feed => {
    try { const r = await fetch(feed.url, { headers: { "User-Agent": "Marketwise/1.0", Accept: "application/rss+xml,application/xml,text/xml" }, next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(); const xml = await r.text(); return { source: feed.source, items: parseHeadlines(xml, feed.source) }; }
    catch { return { source: feed.source, items: [] }; }
  }));
  return { items: results.flatMap(r => r.items).sort((a, b) => (Date.parse(b.published ?? "") || 0) - (Date.parse(a.published ?? "") || 0)), unavailable: results.filter(r => !r.items.length).map(r => r.source) };
}
