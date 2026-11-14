// Verify Stripe's raw signed payload without a network call or production credentials.
import Stripe from "stripe";
export function verifyBillingWebhook(raw: string, signature: string, secret: string) {
  return Stripe.webhooks.constructEvent(raw, signature, secret);
}
