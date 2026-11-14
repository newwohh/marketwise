import Link from "next/link";
import { NewsList } from "@/components/news-list";
import { Markets } from "@/components/markets";
import { getMarkets } from "@/lib/markets";
export const revalidate = 900;
export const metadata = { title: "Stock markets" };
export default async function StocksPage() { const data = await getMarkets("stocks"); return <><Markets initial={data} initialMarket="stocks" /><div className="section-pad market-extras"><p className="eyebrow">FULL TECHNICAL WORKSPACE</p><h2>Go beyond the snapshot.</h2><p>{data.mode === "demo" ? "The overview above uses illustrative prices. " : "The overview above uses provider-supplied stock quotes. "}Open a TradingView chart to explore equity charts and indicators.</p><div className="account-actions">{["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA", "NASDAQ:TSLA"].map(symbol => <Link className="button outline small" href={`/cryptocurrency/chart/${encodeURIComponent(symbol)}`} key={symbol}>{symbol.split(":")[1]} chart ↗</Link>)}</div><h2 className="news-section-heading">The wider market.</h2><NewsList category="stocks" /></div></>; }
