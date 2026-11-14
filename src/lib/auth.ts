// Validate the current identity with the provider, rather than trusting a cookie's user object.
import { createServerSupabase } from "./supabase-server";
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return { user: null, supabase: null };
  try { const { data, error } = await supabase.auth.getUser(); return { user: error ? null : data.user, supabase }; }
  catch { return { user: null, supabase }; }
}
