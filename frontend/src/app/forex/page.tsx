import { Markets } from "@/components/markets";
import { getMarkets } from "@/lib/markets";
export const metadata = { title: "Currencies" };
export const revalidate = 3600;
export default async function ForexPage() { return <Markets initial={await getMarkets("forex")} initialMarket="forex" />; }
