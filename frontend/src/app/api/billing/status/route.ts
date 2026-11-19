import { getAuthenticatedUser } from "@/lib/auth";
import { billingPeriod, liveSubscriptions, safeBillingError } from "@/lib/billing";
export const runtime = "nodejs";
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return Response.json({ error: "Sign in to view billing." }, { status: 401 });
    if (!process.env.STRIPE_SECRET_KEY) return Response.json({ configured: false, pro: false, status: "unconfigured", customer: false });
    const state = await liveSubscriptions(user.id);
    return Response.json({ configured: true, pro: state.pro, customer: !!state.customerId, status: state.current?.status ?? "free", periodEnd: state.current ? billingPeriod(state.current) : null, cancelAtPeriodEnd: state.current?.cancel_at_period_end ?? false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = safeBillingError(error); return Response.json({ error: result.error }, { status: result.status }); }
}
