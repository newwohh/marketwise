import { getAuthenticatedUser } from "@/lib/auth";
import { billingSite, createStripe, liveSubscriptions, safeBillingError } from "@/lib/billing";
import { trustedBillingOrigin } from "@/lib/billing-policy";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!trustedBillingOrigin(request, process.env.NEXT_PUBLIC_SITE_URL)) return Response.json({ error: "The billing request must come from this site." }, { status: 403 });
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return Response.json({ error: "Sign in to manage your subscription." }, { status: 401 });
    const state = await liveSubscriptions(user.id);
    if (!state.customerId) return Response.json({ error: "There is no billing account to manage yet." }, { status: 404 });
    const session = await createStripe().billingPortal.sessions.create({ customer: state.customerId, return_url: `${billingSite()}/account` });
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status }); }
}
