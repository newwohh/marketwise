import { billingAdmin, billingPeriod, configuredPrices, createStripe, safeBillingError } from "@/lib/billing";
import { verifyBillingWebhook } from "@/lib/billing-webhook";
import type Stripe from "stripe";
export const runtime = "nodejs";
const subscriptionEvents = new Set(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "customer.subscription.paused", "customer.subscription.resumed", "customer.subscription.pending_update_applied"]);
export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return Response.json({ error: "The billing webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  if (Number(request.headers.get("content-length") ?? 0) > 1_000_000) return Response.json({ error: "Webhook payload too large." }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ error: "Webhook payload too large." }, { status: 413 });
  let event: Stripe.Event;
  try { event = verifyBillingWebhook(raw, signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return Response.json({ error: "Invalid Stripe signature." }, { status: 400 }); }
  if (!subscriptionEvents.has(event.type) && !["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) return Response.json({ received: true, ignored: true });
  try {
    const object = event.data.object as unknown as { id: string; subscription?: string | { id: string } | null };
    const subscriptionId = subscriptionEvents.has(event.type) ? object.id : typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    if (!subscriptionId?.startsWith("sub_")) return Response.json({ received: true, ignored: true });
    // Fetch the current Stripe object, not the event's possibly old snapshot.
    // The transaction also deduplicates event IDs and rejects older timestamps.
    const subscription = await createStripe().subscriptions.retrieve(subscriptionId);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const admin = billingAdmin();
    const owner = await admin.from("billing_customers").select("user_id").eq("customer_id", customerId).maybeSingle();
    if (owner.error) throw new Error("Billing customer lookup failed");
    if (!owner.data) return Response.json({ received: true, ignored: true });
    if (subscription.metadata.marketwise_user_id !== owner.data.user_id) return Response.json({ error: "Subscription ownership did not match." }, { status: 400 });
    const item = subscription.items.data.find(i => configuredPrices().includes(i.price.id));
    if (!item) return Response.json({ received: true, ignored: true });
    const result = await admin.rpc("sync_stripe_subscription", { p_event_id: event.id, p_event_created: event.created, p_payload: { id: subscription.id, user_id: owner.data.user_id, customer_id: customerId, status: subscription.status, current_period_end: billingPeriod(subscription), price_id: item.price.id, cancel_at_period_end: subscription.cancel_at_period_end } });
    if (result.error) throw new Error("Billing event could not be persisted");
    return Response.json({ received: true, applied: !!result.data });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status }); }
}
