import { getMarkets } from "@/lib/markets";
export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market") ?? "crypto";
  if (market !== "crypto" && market !== "stocks" && market !== "forex") return Response.json({ error: "Unknown market" }, { status: 400 });
  const data = await getMarkets(market);
  return Response.json(data, { headers: { "Cache-Control": data.mode === "live" ? "public, s-maxage=300, stale-while-revalidate=300" : "public, s-maxage=60" } });
}
