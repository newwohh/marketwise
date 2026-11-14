# Configure Marketwise subscriptions

The Stripe integration is implemented but intentionally does not invent prices,
charge cards, or claim a successful live purchase without configuration. A
ChatGPT Pro or Vercel Pro plan is separate from a Marketwise paid subscription.

## Environment

Configure these secrets in the Vercel **marketwise** project. Use Preview/test
values first; production values only after the test flow passes. Never paste
secrets into chat or commit them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Exact canonical origin, e.g. `https://marketwise.bynevin.dev`. Local development: `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anonymous/publishable key; RLS must be enabled. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key for customer ownership and verified webhook writes. |
| `STRIPE_SECRET_KEY` | Server-only Stripe test secret key, later live key. |
| `STRIPE_PRICE_MONTHLY` | Recurring monthly price ID for Marketwise Pro. Optional if only yearly is offered. |
| `STRIPE_PRICE_YEARLY` | Recurring yearly price ID for Marketwise Pro. Optional if only monthly is offered. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for this exact Stripe webhook destination. |

Set one or both price IDs to recurring, fixed-amount prices. `/pricing` reads
the actual currency, amount, interval and interval count from Stripe. It does
not trust a client-supplied amount or price ID. Subscription prices and server
credentials must belong to the same Stripe account and test/live mode.

Apply `supabase/migrations/202611150001_accounts_content.sql`, then
`202611150002_billing.sql`. Browser users can read only their own billing
customer/subscription rows; they cannot write customer mappings, subscription
status, webhook records or invoke the privileged synchronization function.

## Stripe dashboard

1. Create a Marketwise Pro product and the recurring prices you intend to offer.
2. Enable the Customer Portal, choosing the cancellation/plan-change/payment
   method options you want customers to have. The app opens Stripe's portal;
   it never accepts a customer ID from the browser.
3. Add a webhook destination for
   `https://marketwise.bynevin.dev/api/stripe/webhook` (use a stable test/preview
   hostname for test-mode validation).
4. Subscribe to `customer.subscription.created`, `.updated`, `.deleted`,
   `.paused`, `.resumed`, `.pending_update_applied`, and
   `checkout.session.completed` / `checkout.session.async_payment_succeeded`.
5. Save that destination's signing secret as `STRIPE_WEBHOOK_SECRET` and redeploy.

For local testing, Stripe CLI can forward events to
`http://localhost:3000/api/stripe/webhook`. Use its local signing secret locally,
not the deployed destination's secret. Do not send production credentials or
real payment data to a local test session.

## Behaviour

- Checkout and portal POSTs require an authenticated Supabase user and an exact
  configured `Origin`. Preview hosts need their own environment's canonical
  origin; do not use a broad wildcard allowlist.
- Customer creation and repeated checkout clicks use Stripe idempotency keys.
  Existing active, trial, paused or overdue subscribers are directed to the
  portal rather than charged for another subscription.
- A successful Checkout redirect does not grant Pro by itself. `/api/export`
  and `/api/billing/status` verify the customer's current subscriptions directly
  with Stripe. Access requires an allowed configured price, active/trial status,
  and an unexpired period for the matching item.
- Webhooks verify the raw-body Stripe signature and retrieve the latest Stripe
  subscription. One database transaction deduplicates event IDs and prevents
  older event timestamps overwriting newer snapshots. Same-second events use a
  freshly retrieved snapshot; the database cache is never the authority for
  paid access, so stale/reordered cache rows cannot grant Pro.
- Cancellation at period end preserves access through the current paid period.
  Expired, canceled, paused, unpaid and past-due subscriptions fail the Pro gate.
- CSVs retain source, data mode and timestamp. Illustrative quotes remain labelled
  illustrative in the export, and spreadsheet formula text is neutralized.
- The previous Razorpay Starter/Basic/Premium subscriptions are not automatically
  imported into Stripe. Existing subscriber/payment data needs an explicit
  migration and reconciliation before legacy paid access can be represented.

## Acceptance pass before enabling live charges

Use two independently authenticated test accounts and Stripe test cards. Verify:

1. The free user cannot export; unsigned users receive 401.
2. The first account completes test Checkout and sees Pro after Stripe confirms
   its subscription; its export works and the second account remains free.
3. Repeated checkout clicks reuse the session and an existing subscriber is
   directed to Manage billing rather than a second subscription.
4. The portal updates payment details, changes configured plans, and schedules
   cancellation correctly. Access ends when its paid period ends.
5. Invalid webhook signatures fail, duplicate deliveries do not duplicate rows,
   and reordered updates cannot restore access after Stripe cancels a plan.
6. Payment failure, expired periods, unrelated price IDs and another account's
   customer cannot grant Pro. Test subscriptions with multiple price items.

Code tests cover real Stripe signature verification, forged/expired signatures,
origin and authentication failures, server-owned checkout parameters, duplicate
subscription prevention, matching-price/current-period entitlements, CSV output
and currency amount formatting. Actual Stripe transactions, portal operation,
SQL RLS and database transaction behaviour require the configured acceptance pass.
