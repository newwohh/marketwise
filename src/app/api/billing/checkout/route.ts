import { getAuthenticatedUser } from "@/lib/auth";
import { billingSite, configuredPrices, createStripe, ensureCustomer, liveSubscriptions, safeBillingError, BillingError } from "@/lib/billing";
import { trustedBillingOrigin } from "@/lib/billing-policy";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!trustedBillingOrigin(request, process.env.NEXT_PUBLIC_SITE_URL)) return Response.json({ error: "The checkout request must come from this site." }, { status: 403 });
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return Response.json({ error: "Sign in before choosing a paid plan." }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || !["monthly", "yearly"].includes(body.interval)) return Response.json({ error: "Choose a monthly or yearly plan." }, { status: 400 });
    const priceId = body.interval === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    if (!priceId || !configuredPrices().includes(priceId)) throw new BillingError("That plan is not configured yet.");
    const stripe = createStripe();
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || !price.recurring) throw new BillingError("That recurring plan is not available.");
    const customer = await ensureCustomer(user);
    const state = await liveSubscriptions(user.id);
    if (state.subscriptions.some(s => ["active", "trialing", "past_due", "unpaid", "paused"].includes(s.status))) return Response.json({ error: "A subscription already exists. Use Manage billing to change or recover it." }, { status: 409 });
    const site = billingSite();
    const session = await stripe.checkout.sessions.create({ mode: "subscription", customer, line_items: [{ price: priceId, quantity: 1 }], client_reference_id: user.id, metadata: { marketwise_user_id: user.id }, subscription_data: { metadata: { marketwise_user_id: user.id } }, success_url: `${site}/account?checkout=success`, cancel_url: `${site}/pricing?checkout=cancelled` }, { idempotencyKey: `marketwise-checkout-${user.id}-${priceId}-${Math.floor(Date.now() / 900000)}` });
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status }); }
}
