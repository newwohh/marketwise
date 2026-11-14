// User-level request client. Render-only cookie writes are handled by proxy.ts.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./supabase-config";
export async function createServerSupabase() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, { cookies: {
    getAll: () => jar.getAll(),
    setAll(values) {
      try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
      catch { /* Server Components cannot persist cookies; the proxy handles refresh. */ }
    },
  } });
}
