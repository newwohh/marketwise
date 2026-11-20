import Link from "next/link";
import { notFound } from "next/navigation";
import { TradingChart } from "@/components/trading-chart";
import { chartSymbol } from "@/lib/symbols";
export const metadata = { title: "Technical chart" };
export default async function ChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, symbol = chartSymbol(id);
  if (!symbol) notFound();
  return <div className="section-pad technical-page"><div className="section-kicker"><span className="eyebrow">THE TECHNICAL WORKSPACE</span><Link href="/cryptocurrency" className="text-link">Back to markets ↗</Link></div><div className="page-heading"><div><h1>A closer <em>look.</em></h1><p>{symbol} · Candlesticks, timeframes, and technical indicators.</p></div></div><TradingChart symbol={symbol} /><div className="calculation-note"><span className="mono">YOUR CHART, YOUR PERSPECTIVE</span><p>Change the symbol, interval, or chart style with the chart toolbar. Indicators can help describe past prices but do not predict future returns. The third-party chart is independent of Marketwise’s cached overview quotes.</p></div></div>;
}
