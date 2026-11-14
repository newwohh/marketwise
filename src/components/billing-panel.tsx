"use client";
// Checkout and subscription management always use authenticated server handlers.
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatStripeAmount } from "@/lib/billing-policy";
type Plan = { interval: "monthly" | "yearly"; amount: number; currency: string; recurringInterval: string; recurringCount: number };
export function BillingCheckout({ plans }: { plans: Plan[] }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function checkout(interval: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interval }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Checkout could not be opened.");
      if (!result.url || new URL(result.url).hostname !== "checkout.stripe.com") throw new Error("Checkout returned an invalid address.");
      window.location.assign(result.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout is unavailable."); setBusy(false); }
  }
  return <>{plans.length ? <div className="account-actions">{plans.map(plan => <button key={plan.interval} className="button small" disabled={busy} onClick={() => checkout(plan.interval)}>{formatStripeAmount(plan.amount, plan.currency)} / {plan.recurringCount > 1 ? `${plan.recurringCount} ` : ""}{plan.recurringInterval} ↗</button>)}</div> : <p className="provider-caption">Paid plans are not configured yet. No checkout or charge is available.</p>}<p className="provider-caption">Already have a subscription? <Link href="/account#billing">Manage it in your account ↗</Link></p>{message && <p className="notice" role="status">{message}</p>}</>;
}
export function BillingPanel() {
  const [state, setState] = useState<{ configured: boolean; pro: boolean; customer: boolean; status: string; periodEnd?: string; cancelAtPeriodEnd?: boolean } | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/billing/status", { signal: abort.signal, cache: "no-store" }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); return data; }).then(setState).catch(error => { if (!abort.signal.aborted) setMessage(error.message ?? "Billing could not be loaded."); });
    return () => abort.abort();
  }, []);
  async function portal() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" }), data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (!data.url || new URL(data.url).hostname !== "billing.stripe.com") throw new Error("Billing returned an invalid address.");
      window.location.assign(data.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Billing is unavailable."); setBusy(false); }
  }
  return <section id="billing" className="account-panel"><h2>Your subscription.</h2>{state ? <><p>{!state.configured ? "Paid subscriptions are not configured yet. Your free account remains available." : state.pro ? `Marketwise Pro · ${state.status}${state.cancelAtPeriodEnd ? " · Cancels at the end of the current period" : ""}` : "You’re using the free workspace."}</p>{state.periodEnd && <p>Current access period ends {new Date(state.periodEnd).toLocaleDateString()}.</p>}<div className="account-actions">{state.customer && <button className="button outline small" onClick={portal} disabled={busy}>Manage billing ↗</button>}<Link className="button outline small" href="/pricing">View plans ↗</Link></div></> : !message && <p role="status">Loading subscription…</p>}{message && <p className="notice" role="status">{message}</p>}<p className="provider-caption">The server verifies your current Stripe subscription before granting paid access. A ChatGPT or Vercel Pro plan is separate from a Marketwise subscription.</p></section>;
}
