# Marketwise history and feature trace

## Scope and method

Reviewed all 87 commits reachable from legacy `origin/master`, ending at
`869b7c1` (the original frontend), plus its current route, API, market, profile,
academy, blog and support implementations. The new project retains that Git
history through merge commit `56ea5ae`; retaining Git history is not the same
thing as migrating customer accounts or database records.

The audit follows working behaviour and intended user actions. It does not
treat promotional copy, sample fixture values, broken placeholder buttons,
or unsupported security/performance claims as evidence of a working service.

## Historical milestones

| Legacy commit | Evidence and feature | Migration coverage or boundary |
| --- | --- | --- |
| `b1f020d`, `92daec0` | `src/App.js`: education, growth, explore, protection and about pages. | Rebuilt public pages. Education redirects to the academy. The early misspelling `/user_protecttion` now redirects to `/user_protection`. |
| `805c42b`, `235eb15`, `6a50be9` | Crypto/stocks overview and TradingView chart routes. A single early commit used `/cryptocurrency/chart` before `chart/:id`. | Market overview, validated technical-chart symbols and indicators. The old chart without an ID now redirects to BTC. |
| `92603fe`, `ac55eeb`, `c42e693` | Crypto and stock heatmaps, with the stock heatmap using the signed-in user's saved assets through `GET /api/v1/heatmap/:user`. | Public market heatmaps and watchlist filtering. Account-scoped cloud tracking must use validated identity; legacy saved records require an actual backend export to migrate. |
| `19ff55d`, `237cae9`, `edf82b8`, `9238d7d` | Asset selection, quantity, quoted unit price and years in the investment simulator; later expected CAGR and initial/future/profit/ROI display. | Amount and asset-unit modes, current quoted or labelled sample asset prices, time horizon, assumed annual growth, total contributions, modelled growth/value and chart. New monthly contributions add capability. Old intermediate formulas misused a seven-day change/quantity and are not intentionally reproduced. |
| `23dacd0`, `d18ff56` | Plan selection followed by Razorpay order creation and payment verification through the separate backend. | A configured Stripe checkout/portal/webhook replaces the payment provider under the user's configure-later instruction. Historical plan sample prices do not authorize live charges, and redirect success is not proof of payment. |
| `a22e8e4`, `9a54cb0`, `0df26c7`, `b01edcb` | Email/password signup, sign-in, local user context, profile name/email and logout. | Supabase auth/profile implementation is present with configure-later setup. No old password hashes, users or sessions have been exported or migrated automatically. Profile fields were read-only in the last legacy UI; editable profiles are an extension. |
| `a2ddf2d` | Blog feed plus a publishing form. The request posted fixed strings rather than the entered title/body. The feed's full-article button did not navigate to a detail page. | Public post listing/detail and owned create/edit/publish/unpublish/delete are the intended corrected migration. Device-local notebook drafts remain available independently. Actual public persistence requires the configured database and RLS. |
| `f33352f`, `50b1291`, `5ff4515` | Floating help, initially fixed scripted choices and later keyword responses. `Home.jsx` still mounts the floating launcher in legacy master. | Guided support and feature links; no external AI model existed to migrate. Floating help and `/chat` are both present. |
| `7204608`, `acecb16`, `1688499` | Market/news fetch handling and crypto failure behaviour. | Server-side provider adapters, response validation, explicit provider outage/demo states, and original-source RSS news avoid copying embedded API credentials. |
| `14ab8e1` | `StockMarketPrices.jsx` exposes Featured Tickers, Global Exchanges and Dividend Announcements. | Quotes/charts cover featured companies. Added `StockResearch` for a searchable curated exchange directory and a configured real dividend calendar. See the data caveat below. |
| `a4c7e63` | Academy modules: trading basics, brokerage accounts, reading markets, technical analysis, practice and risk management; browser text-to-speech. | All topics, legacy module hash anchors, and browser-native listen/pause/stop controls are represented in the rebuilt academy. |
| `a760e47`, `869b7c1` | Hero background video, linked quick-asset pills/ticker links and product showcase. | The user explicitly chose the current North-inspired design and original 3D motion. The new scene supersedes the old video. Ticker/asset navigation is clickable and retains the new composition. |

## Stock research caveat

The old stock reducer requested Polygon ticker/exchange reference data, but its
third request was a Financial Modeling Prep **gainers** endpoint. The redesigned
stock UI attempted to display that response as dividends and otherwise fell
back to dated payout examples. Those examples are not reliable current
announcements and must not be silently reused.

The new stock quote adapter supports a configured Finnhub key. The new
`src/lib/stock-research.ts` separately requests Finnhub's dividend endpoint for
a fixed set of companies over a bounded date window. Unconfigured keys,
provider-plan denials, malformed responses, missing currency/payment dates,
partial outages and legitimately empty calendars have explicit states. The
exchange directory is labelled curated reference information, not a live
exchange feed. No dividend frequency is inferred from absent provider data.

## Original backend contract

The legacy frontend defaulted to a local backend at `127.0.0.1:5050`. The
following original calls depended on that separate application:

- `POST /api/v1/users/signup`, `POST /api/v1/users/login`,
  `GET /api/v1/users/logout`.
- `POST /api/v1/subscrptions/newsubscription` and
  `GET /api/v1/subscrptions/getsubscription/:user`: saved **asset tracking**,
  distinct from recurring paid-plan subscriptions.
- `GET /api/v1/heatmap/:user`: user-specific market data.
- `GET /api/v1/blogs`, `POST /api/v1/blogs/newblog`: community content.
- `POST /api/v1/plans/chooseplan`, `POST /api/v1/plans/verifypayment`: Razorpay
  order and verification operations.

Supabase/Stripe are replacements for those user-facing capabilities, not a
claim that the old backend API URLs or old records remain operational. An
actual legacy user/content export and a mapping/migration pass are needed
before claiming historical account or authored-post data migration.

## Features not established by the old implementation

- No working order execution, custody, paper-order engine or historical
  backtesting service is evidenced by the simulator description.
- No external LLM, generative market analysis or personalised advice API is
  evidenced by the scripted/keyword help code.
- Footer social buttons pointed at generic platform homepages; these are not
  evidence of official Marketwise social accounts.
- The old forex endpoint listed reference pairs, while its UI described them
  as real-time interbank prices. The rebuilt dated reference-rate source is
  more explicit about what is supplied.
- UI statements about encryption, audits or verification are not evidence of
  end-to-end encryption, a completed security audit or verified user status.

## Checks and remaining evidence

`tests/stock-research.test.ts` checks configured and absent provider access,
credential placement, bounded query dates, invalid/mismatched rows, missing
fields and historical compatibility redirects. It uses fixtures rather than
claiming live dividend-provider entitlement.

Build/route checks and mocked SDK tests cannot establish account isolation,
actual checkout, webhook delivery, browser motion/speech behaviour or data
migration. Complete those acceptance checks against the configured services
and retain the limitations until that evidence exists.

## Resolution in this rebuild

The reported stock-directory/dividend sections, floating help launcher, clickable
home ticker links, and two historical URL variants are now implemented. Accounts,
cloud asset tracking, authored posts and Stripe replacement flows have source,
migrations and tests. Actual PostgreSQL tests now exercise RLS and RPC policies;
real provider configuration, legacy-data import and browser acceptance remain
explicit external steps.
