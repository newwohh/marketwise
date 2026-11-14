// Server-side provider adapters. All destinations are fixed, requests time out, and failures are explicit.
import { z } from "zod";
import type { Market, MarketData } from "./model";
import { demoData } from "./demo";
const coin = z.object({ id: z.string(), symbol: z.string(), name: z.string(), current_price: z.number().nonnegative(), price_change_percentage_24h: z.number().nullable(), price_change_percentage_7d_in_currency: z.number().nullable().optional(), market_cap: z.number().nullable(), total_volume: z.number().nullable(), last_updated: z.string().datetime(), sparkline_in_7d: z.object({ price: z.array(z.number().nonnegative()) }).optional() });
const colors = ["#f3a64a", "#b7a6ed", "#a2f2e3", "#e5d17b", "#aeb8c3", "#d3b887"];
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
const stockQuote = z.object({ c: z.number().positive(), dp: z.number().nullable(), t: z.number().int().positive() });
async function getStocks(request: typeof fetch): Promise<MarketData> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return demoData("stocks");
  const assets = [{ symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" }, { symbol: "NVDA", name: "NVIDIA" }, { symbol: "GOOGL", name: "Alphabet" }, { symbol: "AMZN", name: "Amazon" }, { symbol: "TSLA", name: "Tesla" }];
  const rows = await Promise.all(assets.map(async (asset, index) => {
    try {
      const response = await request(`https://finnhub.io/api/v1/quote?symbol=${asset.symbol}`, { headers: { "X-Finnhub-Token": key }, next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const quote = stockQuote.parse(await response.json());
      const timestamp = new Date(quote.t * 1000);
      if (!Number.isFinite(timestamp.getTime())) return null;
      return { timestamp: timestamp.toISOString(), quote: { id: asset.symbol.toLowerCase(), ...asset, price: quote.c, change: quote.dp, change7d: null, marketCap: null, volume: null, history: [], color: colors[index % colors.length] } };
    } catch { return null; }
  }));
  const available = rows.filter(row => row !== null);
  if (!available.length) return demoData("stocks");
  return { quotes: available.map(row => row.quote), mode: "live", source: "Finnhub", asOf: available.map(row => row.timestamp).sort()[0], note: `Provider stock quotes, cached for five minutes. Delays and exchange coverage depend on the provider plan. No history, market cap, or volume is fabricated.${available.length < assets.length ? " Some tickers are temporarily unavailable." : ""}` };
}
export async function getMarkets(market: Market, request: typeof fetch = fetch): Promise<MarketData> {
  if (market === "stocks") return getStocks(request);
  try {
    if (market === "crypto") {
      const headers: Record<string, string> = {};
      if (process.env.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
      const response = await request("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h,7d", { headers, next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Provider unavailable");
      const rows = z.array(coin).min(1).parse(await response.json());
      return { quotes: rows.map((r, i) => ({ id: r.id, symbol: r.symbol.toUpperCase(), name: r.name, price: r.current_price, change: r.price_change_percentage_24h, change7d: r.price_change_percentage_7d_in_currency ?? null, marketCap: r.market_cap, volume: r.total_volume, history: r.sparkline_in_7d?.price ?? [], color: colors[i % colors.length] })), mode: "live", source: "CoinGecko", asOf: rows.map(r => r.last_updated).sort()[0], note: "Provider quotes, cached for five minutes. Percentage changes cover 24 hours and seven days; charts cover seven days. Not a real-time trading feed." };
    }
    const response = await request("https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,INR,JPY,AUD,CAD,CHF", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Provider unavailable");
    const result = z.object({ date: calendarDate, rates: z.record(z.string().regex(/^[A-Z]{3}$/), z.number().positive()).refine(rates => Object.keys(rates).length > 0) }).parse(await response.json());
    const names: Record<string, string> = { EUR: "Euro", GBP: "British pound", INR: "Indian rupee", JPY: "Japanese yen", AUD: "Australian dollar", CAD: "Canadian dollar", CHF: "Swiss franc" };
    return { quotes: Object.entries(result.rates).map(([symbol, price], i) => ({ id: symbol.toLowerCase(), symbol: `USD/${symbol}`, name: names[symbol] ?? symbol, price, change: null, marketCap: null, volume: null, history: [], color: colors[i % colors.length] })), mode: "live", source: "Frankfurter / ECB", asOf: `${result.date}T00:00:00Z`, note: "Daily reference exchange rates per US dollar. No intraday changes or history are supplied." };
  } catch { return demoData(market); }
}
