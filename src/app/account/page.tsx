// Provider-backed account UI, with truthful unconfigured state and no fabricated sessions.
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { authNotice } from "@/lib/auth-inputs";
import { AuthForms, ProfileForm } from "@/components/auth-forms";
import { signOut } from "./actions";
import { BillingPanel } from "@/components/billing-panel";
export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { user, supabase } = await getAuthenticatedUser();
  if (!supabase) return <div className="section-pad editorial-page"><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h1>A space for you.<br /><em>Being connected.</em></h1><p className="editorial-lead">Account services are not connected in this environment yet. Your browser watchlist and notebook still work on this device.</p><div className="account-panel"><h2>Keep exploring.</h2><p>The account flows are ready to connect after service setup. Existing accounts from the previous app have not been migrated.</p><div className="account-actions"><Link href="/markets" className="button small">Open markets ↗</Link><Link href="/blogs#notebook" className="button outline small">Your notebook ↗</Link></div></div></div>;
  if (!user) return <div className="section-pad auth-layout"><div className="auth-intro"><span className="eyebrow">YOUR OWN POINT OF VIEW</span><h1>A space<br />for <em>you.</em></h1><p>Sign in to your personal workspace, save your research, and manage your account.</p><span className="auth-star" aria-hidden="true">✳</span></div><AuthForms notice={authNotice(notice)} /></div>;
  const { data: profile, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const displayName = profile?.display_name || user.user_metadata?.display_name || "Marketwise member";
  return <div className="section-pad account-page"><div className="section-kicker"><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><form action={signOut}><button className="button outline small">Sign out ↗</button></form></div><div className="page-heading"><div><h1>Your own <em>perspective.</em></h1><p>Welcome, {displayName}. Your account is verified through the connected service.</p></div></div><section className="account-panel"><h2>Your profile.</h2><p>{user.email}</p>{error && <p className="form-message error" role="status">Your saved profile is temporarily unavailable. Your sign-in is still valid.</p>}<ProfileForm displayName={String(displayName)} /><p className="provider-caption">Email changes require verification by the account provider. Contact the site owner if you need to change the account address.</p></section><BillingPanel /><div className="account-panel"><h2>Keep your ideas close.</h2><p>Explore your watchlist, write a field note, or review your plan.</p><div className="account-actions"><Link className="button small" href="/markets">Your watchlist ↗</Link><Link className="button outline small" href="/blogs#notebook">Your field notes ↗</Link><Link className="button outline small" href="/pricing">Manage plan ↗</Link><Link className="button outline small" href="/account/password">Change password ↗</Link></div></div></div>;
}
