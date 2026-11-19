import "server-only";
// Shared database lease plus Stripe's own session state prevent duplicate live
// checkouts across processes, price changes, repeated clicks and retry windows.
import type Stripe from "stripe";
import { billingAdmin, billingSite, BillingError } from "./billing";

export async function withCheckoutLease<T>(userId: string, action: (renew: () => Promise<void>) => Promise<T>): Promise<T> {
  const admin = billingAdmin();
  const token = crypto.randomUUID();
  const args = { p_user_id: userId, p_token: token };
  const acquired = await admin.rpc("acquire_billing_checkout", args);
  if (acquired.error) throw new BillingError("Checkout could not be locked safely. Please try again later.");
  if (acquired.data !== true) throw new BillingError("Another checkout request is in progress. Please try again shortly.", 409);
  const renew = async () => {
    const renewed = await admin.rpc("renew_billing_checkout", args);
    if (renewed.error || renewed.data !== true) throw new BillingError("The checkout lock expired or could not be verified. No new checkout was issued.");
  };
  try { return await action(renew); }
  finally {
    const released = await admin.rpc("release_billing_checkout", args);
    // Do not hand out a URL while lock ownership/release is uncertain. Any Stripe
    // session created before this error is discovered/reused on the next retry.
    if (released.error || released.data !== true) throw new BillingError("Checkout is waiting for a safe retry. Please try again later.");
  }
}

function sessionCustomer(session: Stripe.Checkout.Session) {
  return typeof session.customer === "string" ? session.customer : session.customer?.id;
}

export async function reuseOrCreateCheckout(stripe: Stripe, userId: string, customer: string, priceId: string, renew: () => Promise<void>) {
  const history: Stripe.Checkout.Session[] = [];
  // Enumerate rather than reading one page: an older open URL must not remain
  // purchasable simply because many newer sessions have expired or completed.
  for await (const session of stripe.checkout.sessions.list({ customer, limit: 100 })) {
    if (history.length >= 2000) throw new BillingError("Checkout history needs review before another purchase can be opened.");
    history.push(session);
  }
  let reusable: Stripe.Checkout.Session | undefined;
  const expire: Stripe.Checkout.Session[] = [];
  for (const session of history) {
    if (session.mode !== "subscription" || session.status !== "open") continue;
    if (sessionCustomer(session) !== customer || session.client_reference_id !== userId || session.metadata?.marketwise_user_id !== userId) throw new BillingError("An open checkout could not be safely verified. Contact the site owner.", 409);
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
    const samePrice = items.data.length === 1 && !items.has_more && items.data[0].price?.id === priceId && items.data[0].quantity === 1;
    if (!reusable && samePrice && session.url) reusable = session;
    else expire.push(session);
  }
  for (const session of expire) {
    await renew();
    const expired = await stripe.checkout.sessions.expire(session.id);
    // If someone completed the old URL during this request, Stripe rejects its
    // expiration (or returns non-expired state); never proceed to another charge.
    if (expired.status !== "expired") throw new BillingError("A previous checkout changed state. Review your account before trying again.", 409);
  }
  if (reusable) {
    await renew();
    const latest = await stripe.checkout.sessions.retrieve(reusable.id);
    if (latest.status !== "open" || !latest.url) throw new BillingError("That checkout has changed state. Review your account and try again.", 409);
    return latest;
  }
  await renew();
  const site = billingSite();
  // Derive retries from durable Stripe history, not wall-clock buckets. A timed
  // out create retries the same key until its session can be listed and reused.
  const predecessor = history[0]?.id ?? "first";
  return stripe.checkout.sessions.create({ mode: "subscription", customer, line_items: [{ price: priceId, quantity: 1 }], client_reference_id: userId, metadata: { marketwise_user_id: userId }, subscription_data: { metadata: { marketwise_user_id: userId } }, success_url: `${site}/account?checkout=success`, cancel_url: `${site}/pricing?checkout=cancelled` }, { idempotencyKey: `marketwise-checkout-${userId}-${priceId}-${predecessor}` });
}
