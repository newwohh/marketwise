// Exchange confirmation/recovery links for cookie-backed sessions. Redirects
// remain on this app's origin and failures never echo provider error payloads.
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";
import { safeNext } from "@/lib/model";
export async function GET(request: Request) {
  const url = new URL(request.url), next = safeNext(url.searchParams.get("next"));
  const target = new URL(next, url.origin);
  if (target.origin !== url.origin) target.href = new URL("/account", url.origin).href;
  const supabase = await createServerSupabase();
  const fail = () => NextResponse.redirect(new URL("/account?notice=confirmation", url.origin));
  if (!supabase) return fail();
  try {
    const code = url.searchParams.get("code"), hash = url.searchParams.get("token_hash"), type = url.searchParams.get("type");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(target);
    } else if (hash && type && ["signup", "invite", "magiclink", "recovery", "email_change", "email"].includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: hash, type: type as EmailOtpType });
      if (!error) return NextResponse.redirect(type === "recovery" ? new URL("/account/password", url.origin) : target);
    }
  } catch { /* Failed or expired links share a safe retry destination. */ }
  return fail();
}
