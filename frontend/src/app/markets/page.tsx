import type { Metadata } from "next";
import { Markets } from "@/components/markets";
import { getMarkets } from "@/lib/markets";
export const metadata: Metadata = { title: "Markets" };
export const revalidate = 300;
export default async function MarketsPage() { return <Markets initial={await getMarkets("crypto")} />; }
