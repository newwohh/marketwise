import { notFound } from "next/navigation";
import { Markets } from "@/components/markets";
import { getMarkets } from "@/lib/markets";
export function generateStaticParams() { return [{ market: "cryptocurrency" }, { market: "stocks" }]; }
export const revalidate = 300;
export const metadata = { title: "Market heatmap" };
export default async function HeatmapPage({ params }: { params: Promise<{ market: string }> }) { const { market } = await params; if (market !== "cryptocurrency" && market !== "stocks") notFound(); const key = market === "stocks" ? "stocks" : "crypto"; return <Markets initial={await getMarkets(key)} initialMarket={key} initialGrid />; }
