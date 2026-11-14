import { getAuthenticatedUser } from "@/lib/auth";
import { configuredPrices, createStripe, ensureCustomer, liveSubscriptions, safeBillingError, BillingError } from "@/lib/billing";
import { trustedBillingOrigin } from "@/lib/billing-policy";
import { reuseOrCreateCheckout, withCheckoutLease } from "@/lib/billing-checkout";
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
    const session = await withCheckoutLease(user.id, async renew => {
      const stripe = createStripe();
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active || !price.recurring) throw new BillingError("That recurring plan is not available.");
      const customer = await ensureCustomer(user);
      const state = await liveSubscriptions(user.id);
      if (state.subscriptions.some(s => ["active", "trialing", "past_due", "unpaid", "paused"].includes(s.status))) throw new BillingError("A subscription already exists. Use Manage billing to change or recover it.", 409);
      return reuseOrCreateCheckout(stripe, user.id, customer, priceId, renew);
    });
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status }); }
}
