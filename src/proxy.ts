// Refresh cookie-backed sessions on personal routes; protected handlers still
// validate getUser independently. No authorization is inferred from cookie presence.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase-config";
export async function proxy(request: NextRequest) {
  const config = getSupabasePublicConfig(); if (!config) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  try { await supabase.auth.getUser(); } catch { /* Protected routes handle provider outages. */ }
  response.headers.set("Cache-Control", "private, no-store"); return response;
}
export const config = { matcher: ["/account/:path*", "/auth/:path*", "/api/watchlist/:path*", "/api/posts/:path*", "/api/billing/:path*", "/api/export"] };
