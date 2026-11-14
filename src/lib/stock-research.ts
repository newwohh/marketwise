// Exchange reference information and configured dividend announcements restore
// the old stock research tabs without reusing fabricated distribution values.
import { z } from "zod";

export type Exchange = { name: string; mic: string; operatingMic: string; country: string; region: string; url: string };
export type Dividend = { symbol: string; amount: number; currency: string | null; exDate: string; payDate: string | null; declarationDate: string | null };
export type StockResearchData = {
  exchanges: Exchange[];
  dividends: Dividend[];
  dividendStatus: "unconfigured" | "available" | "partial" | "unavailable";
  unavailableSymbols: string[];
  from: string;
  to: string;
  source: string;
};

const exchanges: Exchange[] = [
  { name: "New York Stock Exchange", mic: "XNYS", operatingMic: "XNYS", country: "United States", region: "Americas", url: "https://www.nyse.com/" },
  { name: "Nasdaq Stock Market", mic: "XNAS", operatingMic: "XNAS", country: "United States", region: "Americas", url: "https://www.nasdaq.com/" },
  { name: "Toronto Stock Exchange", mic: "XTSE", operatingMic: "XTSE", country: "Canada", region: "Americas", url: "https://www.tsx.com/" },
  { name: "London Stock Exchange", mic: "XLON", operatingMic: "XLON", country: "United Kingdom", region: "Europe", url: "https://www.londonstockexchange.com/" },
  { name: "Tokyo Stock Exchange", mic: "XTKS", operatingMic: "XJPX", country: "Japan", region: "Asia-Pacific", url: "https://www.jpx.co.jp/english/" },
  { name: "National Stock Exchange of India", mic: "XNSE", operatingMic: "XNSE", country: "India", region: "Asia-Pacific", url: "https://www.nseindia.com/" },
  { name: "BSE", mic: "XBOM", operatingMic: "XBOM", country: "India", region: "Asia-Pacific", url: "https://www.bseindia.com/" },
  { name: "Hong Kong Stock Exchange", mic: "XHKG", operatingMic: "XHKG", country: "Hong Kong", region: "Asia-Pacific", url: "https://www.hkex.com.hk/" },
];
const dividendSymbols = ["AAPL", "MSFT", "JNJ", "PG", "KO", "PFE"];
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const timestamp = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString().slice(0, 10) === value;
});
const optionalDate = z.union([calendarDate, z.literal("")]).nullish();
const dividendRow = z.object({
  symbol: z.string().optional(), amount: z.number().finite().nonnegative(), date: calendarDate,
  currency: z.string().regex(/^[A-Z]{3}$/).nullish(), payDate: optionalDate, declarationDate: optionalDate,
});

export function parseDividends(value: unknown, symbol: string, from: string, to: string): Dividend[] | null {
  if (!Array.isArray(value) || value.length > 5000) return null;
  const rows: Dividend[] = [];
  for (const item of value) {
    const result = dividendRow.safeParse(item);
    if (!result.success) continue;
    const row = result.data;
    if ((row.symbol && row.symbol !== symbol) || row.date < from || row.date > to) continue;
    rows.push({ symbol, amount: row.amount, currency: row.currency ?? null, exDate: row.date, payDate: row.payDate || null, declarationDate: row.declarationDate || null });
  }
  // A malformed non-empty feed is unavailable, not a successfully empty calendar.
  if (value.length && !rows.length && value.every(item => !dividendRow.safeParse(item).success)) return null;
  return rows;
}

export async function getStockResearch(request: typeof fetch = fetch, now = new Date()): Promise<StockResearchData> {
  const day = 86_400_000;
  const from = new Date(now.getTime() - 180 * day).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 90 * day).toISOString().slice(0, 10);
  const base: StockResearchData = { exchanges, dividends: [], dividendStatus: "unconfigured", unavailableSymbols: [], from, to, source: "Finnhub" };
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return base;
  const results = await Promise.all(dividendSymbols.map(async symbol => {
    try {
      const url = new URL("https://finnhub.io/api/v1/stock/dividend");
      url.search = new URLSearchParams({ symbol, from, to }).toString();
      const response = await request(url.toString(), { headers: { "X-Finnhub-Token": key }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return { symbol, rows: null };
      return { symbol, rows: parseDividends(await response.json(), symbol, from, to) };
    } catch { return { symbol, rows: null }; }
  }));
  const unavailableSymbols = results.filter(result => result.rows === null).map(result => result.symbol);
  const dividends = results.flatMap(result => result.rows ?? []).sort((a, b) => b.exDate.localeCompare(a.exDate));
  return { ...base, dividends, unavailableSymbols, dividendStatus: unavailableSymbols.length === dividendSymbols.length ? "unavailable" : unavailableSymbols.length ? "partial" : "available" };
}
