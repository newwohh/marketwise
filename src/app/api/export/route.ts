// Authenticate and verify paid access server-side before generating a market export.
import { getAuthenticatedUser } from "@/lib/auth";
import { requirePro, safeBillingError } from "@/lib/billing";
import { csvCell } from "@/lib/billing-policy";
import { getMarkets } from "@/lib/markets";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market") ?? "crypto";
  if (market !== "crypto" && market !== "stocks" && market !== "forex") return Response.json({ error: "Unknown market." }, { status: 400 });
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return Response.json({ error: "Sign in to export your market data." }, { status: 401 });
    await requirePro(user.id);
    const data = await getMarkets(market);
    const header = ["symbol", "name", "price", "change_24h_percent", "market_cap", "volume", "source", "mode", "as_of"];
    const rows = data.quotes.map(q => [q.symbol, q.name, q.price, q.change, q.marketCap, q.volume, data.source, data.mode, data.asOf]);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="marketwise-${market}.csv"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } }); }
}
