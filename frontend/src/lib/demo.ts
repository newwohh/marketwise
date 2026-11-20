// Illustrative offline data for the public product preview; not a historical market snapshot.
import type { Market, MarketData, Quote } from "./model";
const series = (price: number, seed: number) => Array.from({ length: 72 }, (_, i) => price * (0.91 + i * 0.0012 + Math.sin(i * .45 + seed) * .018 + Math.cos(i * 1.1 + seed) * .009));
const make = (id: string, symbol: string, name: string, price: number, change: number, cap: number, color: string, seed: number): Quote => ({ id, symbol, name, price, change, marketCap: cap, volume: cap * .035, history: series(price, seed), color });
export const demoQuotes: Record<Market, Quote[]> = {
  crypto: [
    make("bitcoin", "BTC", "Bitcoin", 67432.18, 2.34, 1320000000000, "#f3a64a", 1),
    make("ethereum", "ETH", "Ethereum", 3521.64, 1.82, 423000000000, "#b7a6ed", 2),
    make("solana", "SOL", "Solana", 172.81, 5.67, 79000000000, "#a2f2e3", 3),
    make("binancecoin", "BNB", "BNB", 594.32, -.86, 88000000000, "#e5d17b", 4),
    make("ripple", "XRP", "XRP", .5274, -1.24, 29000000000, "#aeb8c3", 5),
    make("dogecoin", "DOGE", "Dogecoin", .1642, 4.12, 23000000000, "#d3b887", 6),
    make("avalanche-2", "AVAX", "Avalanche", 36.19, 3.18, 14000000000, "#f48a91", 7),
    make("chainlink", "LINK", "Chainlink", 17.53, -2.16, 10000000000, "#8caff8", 8),
  ],
  stocks: [
    make("aapl", "AAPL", "Apple", 192.35, 1.24, 2950000000000, "#c2cbd4", 2),
    make("msft", "MSFT", "Microsoft", 425.52, .82, 3160000000000, "#8fb9e6", 5),
    make("nvda", "NVDA", "NVIDIA", 121.78, 3.42, 2990000000000, "#bee77a", 1),
    make("googl", "GOOGL", "Alphabet", 176.33, -.64, 2180000000000, "#f3bb8c", 3),
    make("amzn", "AMZN", "Amazon", 183.13, 1.18, 1910000000000, "#e7c48d", 4),
    make("tsla", "TSLA", "Tesla", 178.79, -2.38, 570000000000, "#e78d9b", 8),
  ],
  forex: [
    make("eur", "USD/EUR", "Euro", .9226, .12, 0, "#b7a6ed", 2),
    make("gbp", "USD/GBP", "British pound", .7829, -.08, 0, "#a2f2e3", 4),
    make("inr", "USD/INR", "Indian rupee", 83.42, .04, 0, "#f3bb8c", 3),
    make("jpy", "USD/JPY", "Japanese yen", 156.82, -.24, 0, "#f48a91", 7),
  ],
};
export function demoData(market: Market): MarketData {
  return { quotes: demoQuotes[market], mode: "demo", source: "Illustrative sample", asOf: null, note: market === "stocks" ? "Stock prices are illustrative. A licensed stock-data provider is not connected." : "The market-data provider is unavailable. Showing illustrative prices and charts, not current quotes." };
}
