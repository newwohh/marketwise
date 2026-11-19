import { Markets } from "@/components/markets";
import { getMarkets } from "@/lib/markets";
import { NewsList } from "@/components/news-list";
export const metadata = { title: "Cryptocurrency" };
export const revalidate = 300;
export default async function CryptoPage() { return <><Markets initial={await getMarkets("crypto")} /><section className="section-pad market-extras"><div className="section-kicker"><span className="eyebrow">CRYPTO IN CONTEXT</span></div><h2>Beyond the price.</h2><NewsList category="crypto" /></section></>; }
