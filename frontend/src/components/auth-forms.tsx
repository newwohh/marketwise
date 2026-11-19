"use client";
// Password forms submit through server actions and never store passwords locally.
import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset, resendConfirmation, updatePassword, updateProfile, type AuthState } from "@/app/account/actions";
const initial: AuthState = { ok: false, message: "" };
function Feedback({ state }: { state: AuthState }) { return state.message ? <p className={`form-message ${state.ok ? "" : "error"}`} role="status">{state.message}</p> : null; }
export function AuthForms({ notice }: { notice?: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "confirm">("signin");
  return <section className="auth-panel"><div className="basis-tabs" role="group" aria-label="Account action"><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>{notice && <p className="form-message" role="status">{notice}</p>}{mode === "reset" ? <ResetForm /> : mode === "confirm" ? <ConfirmationForm /> : mode === "signup" ? <SignupForm /> : <SigninForm />}<div className="auth-links" style={{ flexWrap: "wrap" }}><button className="text-link" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? "Back to sign in" : "Forgot your password?"}</button><button className="text-link" onClick={() => setMode("confirm")}>Resend confirmation</button><Link href="/user_protection">Privacy & security ↗</Link></div></section>;
}
function SigninForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return <><h2>Welcome back.</h2><p>Keep your own perspective close.</p><form action={action} className="auth-form"><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><label>Password<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label><button className="button" disabled={pending}>{pending ? "Signing in…" : "Sign in ↗"}</button></form><Feedback state={state} /></>;
}
function SignupForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  return <><h2>A space of your own.</h2><p>Create your Marketwise account.</p><form action={action} className="auth-form"><label>Display name<input name="displayName" autoComplete="nickname" maxLength={80} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><small className="muted">Use at least 12 characters. Your email may need confirmation before sign-in.</small><button className="button" disabled={pending}>{pending ? "Creating account…" : "Create account ↗"}</button></form><Feedback state={state} /></>;
}
function ResetForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return <><h2>A fresh start.</h2><p>Request a password-reset link by email.</p><form action={action} className="auth-form"><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><button className="button" disabled={pending}>{pending ? "Requesting link…" : "Send reset link ↗"}</button></form><Feedback state={state} /></>;
}
function ConfirmationForm() {
  const [state, action, pending] = useActionState(resendConfirmation, initial);
  return <><h2>Confirm your perspective.</h2><p>Request a fresh account-confirmation link.</p><form action={action} className="auth-form"><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><button className="button" disabled={pending}>{pending ? "Requesting link…" : "Resend confirmation ↗"}</button></form><Feedback state={state} /></>;
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return <section className="auth-panel"><h2>Choose a new password.</h2><p>Use a unique password you don’t use elsewhere.</p><form action={action} className="auth-form"><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className="button" disabled={pending}>{pending ? "Updating…" : "Update password ↗"}</button></form><Feedback state={state} /><Link className="text-link" href="/account">Return to your account ↗</Link></section>;
}
export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return <form action={action} className="auth-form"><label>Display name<input name="displayName" defaultValue={displayName} autoComplete="nickname" maxLength={80} required /></label><button className="button small" disabled={pending}>{pending ? "Saving…" : "Save profile ↗"}</button><Feedback state={state} /></form>;
}
