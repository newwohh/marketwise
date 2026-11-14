# Configure Marketwise

The source includes the complete account, publishing, cloud-watchlist and Stripe
billing flows. Public tools work without those services. Configure provider
accounts before treating the connected features as verified in production.

## 1. Local development

Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env.local`, and set
`NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Run `npm run dev`.

Do not reuse API keys embedded in the legacy frontend; replace/rotate them in
their provider accounts. Keep new keys in local or Vercel secret settings.

## 2. Supabase accounts and data

Create or select the intended Supabase project. Apply all files in
`supabase/migrations/` in filename order using the Supabase SQL editor or CLI.
Do not disable row-level security. Migrations create profiles, account-scoped
watchlists, public/private field notes, billing mappings, webhook state and
checkout coordination.

Set these environment variables locally and on the Vercel `marketwise` project:

| Variable | Value/source |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative legacy public key; use one public-key variable |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key for billing operations |
| `NEXT_PUBLIC_SITE_URL` | `https://marketwise.bynevin.dev` in production |

In Supabase Authentication URL settings, set the production Site URL to
`https://marketwise.bynevin.dev`. Allow the exact callback
`https://marketwise.bynevin.dev/auth/callback`; add the local callback only for
development. Enable email confirmation and configure an email/SMTP service for
delivery and recovery. Test confirmation, reset and recovery links end to end.

The account page handles registration, sign-in, confirmation resends, sign-out,
profile updates and password recovery. Legacy Mongo/Razorpay accounts and
password hashes are not automatically imported. A migration needs a deliberate
user-ID mapping and a provider-supported import or password-reset invitation;
never copy plaintext passwords or browser session tokens.

## 3. Stripe test-mode subscriptions

Follow `BILLING_SETUP.md`. Start in test mode. Create the intended recurring
prices and set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY` and/or
`STRIPE_PRICE_YEARLY`. The application displays actual configured amounts.

Create a webhook endpoint at
`https://marketwise.bynevin.dev/api/stripe/webhook` for the documented checkout
and subscription events, and set `STRIPE_WEBHOOK_SECRET`. Enable the Stripe
customer billing portal for the account. The SQL billing migrations must be
applied before checkout.

Exercise purchase, repeated clicks, monthly/yearly changes, cancellation,
expired access, signed/replayed/out-of-order events and denied paid exports
before enabling real charges. A success redirect never grants paid access;
exports verify the current Stripe subscription server-side.

## 4. Market data

- Crypto: CoinGecko public API, optionally `COINGECKO_API_KEY` for its Demo API.
- Currency reference rates: Frankfurter/ECB, no key required.
- Stock quotes and dividend research: `FINNHUB_API_KEY`. Dividend endpoint
  coverage may require a different Finnhub plan. Unavailable data is labelled;
  the app never substitutes invented dividend payouts.
- Technical charts: TradingView public embeds. Exchange restrictions/delays
  depend on the provider.
- News: publisher RSS headlines and source links. No old news API keys are used.

## 5. Vercel and the domain

Project `marketwise` is deployed at `https://marketwise.bynevin.dev`. Set private
variables in Vercel Project Settings → Environment Variables. Public Supabase
variables are build-time inputs, so redeploy after changing them. See
`DEPLOYMENT.md` for exact project/deployment identifiers and DNS history.

The Cloudflare CNAME for `marketwise` must remain DNS-only and point to
`bb35a45b288b0bc0.vercel-dns-017.com`. Do not change unrelated zone records.

The rebuild branch is `rebuild/marketwise-production` in
`https://github.com/newwohh/marketwise-frontend`, reviewed in PR #1. Commits are
grouped by feature. The original `master` history remains available. To enable
future automatic deployments, link this existing Vercel project to that GitHub
repository/production branch after reviewing the PR; avoid creating a second
Vercel project with the same application.

## 6. Verify

Run `npm test`, `npm run build`, and `npm run typecheck`. Tests include real
PostgreSQL/PGlite execution of the tracked migrations and RLS/RPC boundaries,
plus controlled provider and real Stripe-signature checks. They do not replace
configured Supabase email delivery or Stripe test-mode acceptance.

Then check desktop/mobile layouts, hero pause/reduced motion, navigation,
search/watchlists, simulator, speech, TradingView and notebook editing in a
browser. Two real test accounts must not read or modify each other’s private
data. Check public posts while signed out.

`FEATURE_PARITY.md` and `HISTORY_AUDIT.md` trace the legacy behaviour and limits.
`BROWSER_QA.md` records the unavailable automation runtime rather than claiming
unperformed browser tests passed.
