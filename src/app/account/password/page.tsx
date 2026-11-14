import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { PasswordForm } from "@/components/auth-forms";
export const metadata = { title: "Change password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function PasswordPage() {
  const { user } = await getAuthenticatedUser();
  return <div className="section-pad auth-layout"><div className="auth-intro"><span className="eyebrow">A FRESH START</span><h1>Protect your<br /><em>perspective.</em></h1><p>Reset links expire. Request a new one if your session is no longer valid.</p></div>{user ? <PasswordForm /> : <div className="auth-panel"><h2>A fresh link is needed.</h2><p>Sign in, or request a password-reset link from your account page.</p><Link href="/account" className="button small">Open account ↗</Link></div>}</div>;
}
