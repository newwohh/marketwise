# Marketwise

A new, independent rebuild of Marketwise using Next.js 16, React, TypeScript,
and a visual direction inspired by North: charcoal, lilac, editorial typography,
fine grid lines, and original orbital artwork. No source or credentials from the
old application are copied into this project.

## Current implementation

- Responsive marketing page with original content and artwork.
- Market workspace with search, sorting, browser-persisted watchlists, asset
  detail dialogs, seven-day charts, and heatmap view.
- CoinGecko cryptocurrency adapter, server-side validation, bounded requests,
  five-minute caching, and explicit illustrative fallback data.
- Frankfurter/ECB daily USD reference exchange rates, labelled with their source
  date. Unavailable daily changes and history remain empty.
- Stock data is **illustrative only**. A licensed stock-data source has not been
  connected. No sample price is presented as a current price.
- Investment simulator using an effective annual return converted to a monthly
  rate, with end-of-month contributions. Supports zero and negative returns.
- Original learning articles, SEO metadata, robots, sitemap, health endpoint,
  security headers, CI, and weekly dependency-update proposals.

## Incomplete — do not call this production-ready

The account, cloud-watchlist, subscription, and Pro-export flows are not yet
implemented or provisioned. Navigation to `/account` and `/pricing` and the Pro
export action are reserved for this next phase; they are not acceptance-tested
features. The public marketing copy describes the intended complete product.
Do not release this branch as a completed product until those flows are ready.

Vercel project access is now authorized. The `marketwise` project and its first
production-target deployment are READY. The homepage, health endpoint, and daily
forex endpoint returned HTTP 200 through authenticated deployment access. This
is an incomplete review build, not a completed production-ready product.
See `DEPLOYMENT.md` for the verified deployment and DNS configuration. GitHub writes were also denied earlier in this session; there is no
new remote repository or pull request for this rebuild yet. Cloudflare DNS has
not been changed. The browser automation environment is unavailable, so visual
and interactive browser QA is still outstanding.

## Local development

Use Node.js 24 LTS.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Public market APIs work without local secrets,
subject to provider availability and rate limits. The `.env.example` records the public site URL and optional market-data key.
Authentication and billing variables will be provisioned by the selected real
services before those flows are implemented.
Never copy credentials from the old frontend.

## Verify

```sh
npm test
npm run build
npm run typecheck
```

The current tests cover calculation behaviour, zero/negative rates, invalid
inputs, source failures, malformed data, currency semantics, invalid market
selectors, redirect safety, and the pure subscription-status predicate. The
predicate tests do **not** verify a real billing integration.

## Release plan

1. Vercel access and new `marketwise` project creation are complete. The old
   repository and deployment remain separate.
2. Provision actual authentication and subscription services. Vercel recommends
   Clerk for authentication and Stripe for SaaS subscriptions. Install and read
   their integration guidance before implementing against real configuration.
   Keep private credentials in Vercel environment settings, never in Git or chat.
3. Implement verified sign-up/sign-in/sign-out/password recovery, protected
   account APIs, durable per-user watchlists, subscription checkout, billing
   management, signed/idempotent webhook handling, and server-side Pro checks.
   Use provider prices rather than making up a paid plan price.
4. Validate isolation between two test accounts and a complete Stripe test-mode
   purchase, duplicate/out-of-order webhook delivery, cancellation, expiry, and
   denied exports for unpaid users. Confirm the intended live price before
   enabling real charges.
5. Add the complete source to a new GitHub repository and enable CI. Build and
   test an exact revision, then deploy that revision to Vercel.
6. Add `marketwise.bynevin.dev` to that Vercel project. Read its actual recommended
   DNS target and any ownership-verification record. Configure only this
   subdomain in Cloudflare (initially DNS-only); leave the apex, nameservers,
   mail, and unrelated records untouched. Do not guess a universal CNAME target.
7. Set the production site URL and authentication redirect allowlist. Verify DNS,
   TLS, direct route loads, data sources, mobile/desktop layouts, keyboard
   navigation, accounts, and billing on the final domain before launch.

Useful endpoints: `/api/health` and `/api/markets?market=crypto|stocks|forex`.

## Rights

Private project. The visual reference informs the design direction; North logos,
proprietary fonts, artwork, copy, and customer claims are not reproduced.
