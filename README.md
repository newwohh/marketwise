# Marketwise

Market research, investment scenarios, watchlists and field notes in a
North-inspired charcoal/lilac workspace with an original animated 3D hero.

- Website: https://marketwise.bynevin.dev
- Repository: https://github.com/newwohh/marketwise-frontend
- Rebuild: `rebuild/marketwise-production` — PR #1 preserves the legacy history.

## Features

- Crypto and currency data with source validation and explicit fallback labels.
- Configurable Finnhub stock quotes, exchange reference directory, and dividend
  announcements; TradingView technical charts and crypto/stock heatmaps.
- Amount/asset-unit investment simulation with monthly contributions, zero and
  negative returns, and bounded finite results.
- Browser watchlists plus account sync retaining the newest 100 assets atomically.
- Local research drafts plus account-owned drafts and public publishing, editing,
  unpublishing and deletion; public field-note pages and pagination.
- Supabase registration, sign-in/out, confirmation, recovery and profile editing.
- Stripe subscription checkout, billing portal, signed/replayed-event handling,
  checkout coordination and current-subscription checks for paid CSV exports.
- Academy read-aloud, original-source news, guided help and floating launcher.
- Legacy URLs, accessible navigation, local fonts, responsive design, SEO, CI and
  dependency update proposals.

## Configure later

See [SETUP.md](SETUP.md) for exact provider/environment steps and migrations.
Public research tools run without account/payment keys. Connected features
fail clearly until configured; no fake account, success or payment is created.

Apply all `supabase/migrations/*.sql` in order, configure Supabase email delivery
and callbacks, add Stripe test keys/prices/webhook/portal, and redeploy after
changing public build-time variables. Optional market keys are server-only.

Implementation is not a claim that live accounts/payments have been verified.
Old user/content records and password hashes have not been imported. Live
provider acceptance and browser interaction still need the checks in SETUP.md.

## Develop and verify

Use Node.js 24 LTS:

```sh
npm ci
npm run dev
# http://localhost:3000

npm test
npm run build
npm run typecheck
```

Tests exercise validation, ownership boundaries, SDK request contracts, real
Stripe signatures, GPU cleanup and the actual SQL migrations under PostgreSQL
/PGlite. Database tests supply only the provider's auth runtime fixture; tracked
RLS policies and RPC functions are executed unchanged.

## Migration evidence

- [FEATURE_PARITY.md](FEATURE_PARITY.md): routes and feature status.
- [HISTORY_AUDIT.md](HISTORY_AUDIT.md): trace through 87 legacy commits.
- [QA_REPORT.md](QA_REPORT.md): calculation/data/motion findings.
- [BROWSER_QA.md](BROWSER_QA.md): exact unavailable-browser limitation.
- [CONTENT_SETUP.md](CONTENT_SETUP.md) and [BILLING_SETUP.md](BILLING_SETUP.md).
- [DEPLOYMENT.md](DEPLOYMENT.md): recorded deployment/DNS verification.

Private project. The visual reference informs the direction; North's logos,
proprietary fonts, copy and customer claims are not reproduced.
