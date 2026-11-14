"use server";
// Next server actions enforce same-origin submission. Profile writes use the
// provider-verified identity and never accept a browser-supplied user ID.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { authSiteUrl } from "@/lib/supabase-config";
import { displayNameInput, emailInput, passwordInput, signinInput, signupInput } from "@/lib/auth-inputs";
export type AuthState = { ok: boolean; message: string };
const unavailable: AuthState = { ok: false, message: "Account services are not connected yet. The public workspace is still available." };
const failed = (message: string): AuthState => ({ ok: false, message });
export async function signIn(_previous: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signinInput.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return failed("Enter a valid email and password.");
  const supabase = await createServerSupabase(); if (!supabase) return unavailable;
  try { const { error } = await supabase.auth.signInWithPassword(parsed.data); if (error) return failed("Sign-in failed. Check your email and password, and confirm your email if needed."); }
  catch { return failed("Sign-in is temporarily unavailable. Please try again."); }
  revalidatePath("/account"); redirect("/account");
}
export async function signUp(_previous: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signupInput.safeParse({ email: form.get("email"), password: form.get("password"), displayName: form.get("displayName") });
  if (!parsed.success) return failed("Enter a display name, valid email, and a password of 12–128 characters.");
  const supabase = await createServerSupabase(); if (!supabase) return unavailable;
  try {
    const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: parsed.data.displayName }, emailRedirectTo: `${authSiteUrl()}/auth/callback?next=/account` } });
    if (error) return failed("Sign-up could not be completed. Please check the details and try again.");
    if (!data.session) return { ok: true, message: "Check your inbox for the confirmation link. If this email already has an account, sign in or reset its password." };
  } catch { return failed("Registration is temporarily unavailable. Please try again."); }
  revalidatePath("/account"); redirect("/account");
}
export async function requestPasswordReset(_previous: AuthState, form: FormData): Promise<AuthState> {
  const email = emailInput.safeParse(form.get("email")); if (!email.success) return failed("Enter a valid email address.");
  const supabase = await createServerSupabase(); if (!supabase) return unavailable;
  try { const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${authSiteUrl()}/auth/callback?next=/account/password` }); if (error) return failed("A reset email could not be requested right now. Please try again later."); }
  catch { return failed("Password reset is temporarily unavailable. Please try again."); }
  return { ok: true, message: "If an account exists for this address, a password-reset email will arrive shortly." };
}
export async function resendConfirmation(_previous: AuthState, form: FormData): Promise<AuthState> {
  const email = emailInput.safeParse(form.get("email")); if (!email.success) return failed("Enter a valid email address.");
  const supabase = await createServerSupabase(); if (!supabase) return unavailable;
  try {
    const { error } = await supabase.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: `${authSiteUrl()}/auth/callback?next=/account` } });
    if (error) return failed("A confirmation email could not be requested right now. Please try again later.");
  } catch { return failed("Confirmation emails are temporarily unavailable. Please try again."); }
  return { ok: true, message: "If this address has an unconfirmed account, a new confirmation link will arrive shortly." };
}
export async function updatePassword(_previous: AuthState, form: FormData): Promise<AuthState> {
  const password = passwordInput.safeParse(form.get("password"));
  if (!password.success || form.get("password") !== form.get("confirmPassword")) return failed("Use matching passwords of 12–128 characters.");
  const { user, supabase } = await getAuthenticatedUser(); if (!supabase) return unavailable;
  if (!user) return failed("Your reset session has expired. Request a fresh password-reset email.");
  try { const { error } = await supabase.auth.updateUser({ password: password.data }); if (error) return failed("Your password could not be updated. Try a fresh reset link or a different password."); }
  catch { return failed("Password updates are temporarily unavailable. Please try again."); }
  return { ok: true, message: "Your password has been updated. You can return to your account." };
}
export async function updateProfile(_previous: AuthState, form: FormData): Promise<AuthState> {
  const name = displayNameInput.safeParse(form.get("displayName")); if (!name.success) return failed("Use a display name between 1 and 80 characters.");
  const { user, supabase } = await getAuthenticatedUser(); if (!supabase) return unavailable;
  if (!user) return failed("Sign in before editing your profile.");
  try {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.data, updated_at: new Date().toISOString() });
    if (error) return failed("Your profile could not be saved. Please try again later.");
    const { error: metadataError } = await supabase.auth.updateUser({ data: { display_name: name.data } });
    if (metadataError) return failed("Your profile name was saved, but account details could not be refreshed. Please try saving again.");
  } catch { return failed("Profile updates are temporarily unavailable. Please try again."); }
  revalidatePath("/account"); return { ok: true, message: "Your profile has been saved." };
}
export async function signOut() {
  const supabase = await createServerSupabase();
  let failed = false;
  try { if (supabase) { const { error } = await supabase.auth.signOut(); failed = !!error; } }
  catch { failed = true; }
  if (failed) redirect("/account?notice=signout-failed");
  revalidatePath("/account"); redirect("/account?notice=signed-out");
}
