// Authenticated cloud watchlist. RLS and explicit user predicates protect each account.
import { getAuthenticatedUser } from "@/lib/auth";
import { watchlistInput, watchlistItem } from "@/lib/posts-contract";
import { contentFailure, contentJson, ContentRequestError, requireContentOrigin } from "@/lib/posts-http";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
async function account() { const { user, supabase } = await getAuthenticatedUser(); if (!supabase) throw new ContentRequestError("Cloud watchlists are not available until account services are configured.", 503); if (!user) throw new ContentRequestError("Sign in to sync your watchlist.", 401); return { user, supabase }; }
export async function GET() {
  try { const { user, supabase } = await account(); const { data, error } = await supabase.from("watchlists").select("market,symbol").eq("user_id", user.id).order("created_at", { ascending: false }).order("market", { ascending: false }).order("symbol", { ascending: false }).limit(100); if (error) throw error; return Response.json({ items: data.slice().reverse().map(row => `${row.market}:${row.symbol}`), capacity: 100 }, { headers }); } catch (error) { return contentFailure(error); }
}
export async function POST(request: Request) {
  try { requireContentOrigin(request); const { supabase } = await account(); const parsed = watchlistInput.safeParse(await contentJson(request)); if (!parsed.success) throw new ContentRequestError("Choose up to 100 valid market assets.", 400); const { data, error } = await supabase.rpc("sync_watchlist", { p_items: [...new Set(parsed.data.items)] }); if (error) throw error; if (!Array.isArray(data) || data.length > 100) throw new Error("Unexpected watchlist response"); return Response.json({ items: data.map((row: { market: string; symbol: string }) => `${row.market}:${row.symbol}`), capacity: 100 }, { headers }); } catch (error) { return contentFailure(error); }
}
export async function DELETE(request: Request) {
  try { requireContentOrigin(request); const { user, supabase } = await account(); const url = new URL(request.url); const key = `${url.searchParams.get("market")}:${url.searchParams.get("symbol")}`; if (!watchlistItem.safeParse(key).success) throw new ContentRequestError("Choose a valid market asset.", 400); const [market, symbol] = key.split(":"); const { error } = await supabase.from("watchlists").delete().eq("user_id", user.id).eq("market", market).eq("symbol", symbol); if (error) throw error; return Response.json({ removed: key }, { headers }); } catch (error) { return contentFailure(error); }
}
