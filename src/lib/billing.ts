import "server-only";
// Stripe is the authority for paid access. Supabase stores customer ownership and
// webhook snapshots; stale, replayed, or reordered snapshots cannot grant Pro.
import Stripe from "stripe";
import { createServiceSupabase } from "@/lib/supabase-admin";
import { subscriptionAccess, subscriptionPeriodEnd, type BillingSubscription } from "./billing-policy";

export class BillingError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export function configuredPrices() { return [process.env.STRIPE_PRICE_MONTHLY, process.env.STRIPE_PRICE_YEARLY].filter((p): p is string => !!p); }
export function createStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new BillingError("Subscriptions are not configured yet. The public workspace remains free.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 12000 });
}
export function billingAdmin() {
  const client = createServiceSupabase();
  if (!client) throw new BillingError("Account billing storage is not configured yet.");
  return client;
}
export function billingSite() {
  if (!process.env.NEXT_PUBLIC_SITE_URL) throw new BillingError("The billing return address is not configured yet.");
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL);
  if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) throw new BillingError("The billing return address must use HTTPS.");
  return site.origin;
}
export async function customerForUser(userId: string) {
  const { data, error } = await billingAdmin().from("billing_customers").select("customer_id").eq("user_id", userId).maybeSingle();
  if (error) throw new BillingError("Billing storage could not be read. Please try again later.");
  return data?.customer_id as string | undefined;
}
export async function ensureCustomer(user: { id: string; email?: string }) {
  const existing = await customerForUser(user.id);
  if (existing) return existing;
  const stripe = createStripe();
  const customer = await stripe.customers.create({ email: user.email, metadata: { marketwise_user_id: user.id } }, { idempotencyKey: `marketwise-customer-${user.id}` });
  const { error } = await billingAdmin().from("billing_customers").insert({ user_id: user.id, customer_id: customer.id });
  if (error) {
    // A concurrent request may have inserted the same idempotently-created customer.
    const winner = await customerForUser(user.id);
    if (winner) return winner;
    throw new BillingError("The billing account could not be saved. No checkout was created.");
  }
  return customer.id;
}
export async function liveSubscriptions(userId: string) {
  const customerId = await customerForUser(userId);
  if (!customerId) return { customerId: null, subscriptions: [], pro: false, current: null };
  const stripe = createStripe();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || customer.metadata.marketwise_user_id !== userId) throw new BillingError("The billing account could not be verified.", 403);
  // Query current states separately so a long history of cancelled plans cannot
  // hide an older active subscription behind the first page of historical rows.
  const results = await Promise.all((["active", "trialing", "past_due", "unpaid", "paused"] as const)
    .map(status => stripe.subscriptions.list({ customer: customerId, status, limit: 100 })));
  const subscriptions = results.flatMap(result => result.data);
  const prices = configuredPrices();
  const current = subscriptions.find(s => subscriptionAccess(s as BillingSubscription, prices)) ?? null;
  return { customerId, subscriptions, pro: !!current, current };
}
export async function requirePro(userId: string) {
  if (!configuredPrices().length) throw new BillingError("Paid access is not configured yet.");
  const state = await liveSubscriptions(userId);
  if (!state.pro) throw new BillingError("This export requires an active Marketwise Pro subscription.", 403);
  return state;
}
export async function publicBillingPlans() {
  if (!process.env.STRIPE_SECRET_KEY || !configuredPrices().length) return [];
  const stripe = createStripe();
  return Promise.all((["monthly", "yearly"] as const).flatMap(interval => {
    const id = interval === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    if (!id) return [];
    return [stripe.prices.retrieve(id).then(price => {
      if (!price.active || !price.recurring || price.unit_amount === null) return null;
      return { interval, amount: price.unit_amount, currency: price.currency, recurringInterval: price.recurring.interval, recurringCount: price.recurring.interval_count };
    })];
  })).then(plans => plans.filter((p): p is NonNullable<typeof p> => !!p));
}
export function safeBillingError(error: unknown) {
  return error instanceof BillingError ? { error: error.message, status: error.status } : { error: "The billing service is temporarily unavailable. No payment status was changed.", status: 503 };
}
export function billingPeriod(subscription: Stripe.Subscription) { return subscriptionPeriodEnd(subscription as BillingSubscription, configuredPrices()); }
