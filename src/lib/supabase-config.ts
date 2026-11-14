// Public configuration is safe to bundle; service-role credentials never belong here.
export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) return null;
    return { url: parsed.origin, key };
  } catch { return null; }
}
export function authSiteUrl() {
  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://marketwise.bynevin.dev").origin; }
  catch { return "https://marketwise.bynevin.dev"; }
}
