# Original Marketwise feature audit

This audit compares the original frontend at `/workspace/marketwise-original`
with the new project. A reachable route does not establish backend integration
parity. Account-dependent implementation is present, with live-provider acceptance
pending configuration. The user requested configure-later setup.

## Routes and behaviour

| Original route or feature | Rebuild destination | Status and limits |
| --- | --- | --- |
| `/` marketing homepage | `/` | Rebuilt in the North-inspired style; original reflective 3D sculpture, slow rotation, pointer response, pause control, lazy loading, offscreen suspension, reduced-motion/WebGL fallback. |
| `/cryptocurrency` | Same route or `/markets` | Search, sorting, price, 24h and 7d changes, market cap, volume, seven-day charts, browser watchlists. CoinGecko provider/fallback status is explicit. |
| `/stocks` | Same route | Configurable Finnhub quotes, technical charts, curated exchange directory and provider dividend announcements. Missing keys/plan access remain explicit and no dividend values are invented. |
| Forex section/menu | `/forex` | Added a working direct route; daily Frankfurter/ECB USD reference rates. No invented intraday changes. |
| `/cryptocurrency/chart/:id` | Same route | Restored TradingView technical chart embedding, symbol changes, intervals and provider controls. Supports common named coins, CoinPaprika IDs, tickers and explicit exchange symbols. Browser operation of third-party widget remains unverified. |
| `/heatmap/cryptocurrency` | Same route | Crypto heatmap with positive/negative intensity and asset details. |
| `/heatmap/stocks` | Same route | Stock heatmap uses configured quotes or explicit illustrative fallback. Account watchlist filtering is available; old backend records require an export to import. |
| Asset “subscribe” action | Browser/account watchlist | Device-local tracking plus authenticated cloud merge/delete; SQL atomically retains the newest 100 keys. Old saved asset records are not imported automatically. |
| Crypto and stock news sections | Market sections and `/news` | Original publisher RSS headlines from CoinDesk/MarketWatch with dates and source links; explicit feed outages. No old API credentials copied. |
| `/investsimulator` | Redirect to `/simulator` | Amount mode and restored asset/quantity mode; annual rate, years, initial capital, modelled value/gain, chart. Adds monthly contributions and correct zero/negative-return handling. Not historical backtesting or order execution. |
| `/education` | Redirect to `/learn` | Modules cover trading, broker accounts, market reading, technical analysis, practice, risk, compounding and diversification. Restored browser-native read-aloud, pause and stop. Old module hash anchors retained on academy cards. |
| `/grow` | Same route | Rebuilt growth/learning pillars with direct links to research tools. |
| `/explore` | Same route | Complete product hub for crypto, stocks, forex, heatmaps, simulator, academy, news and blogs. |
| `/blogs` | Same route | Editorial field notes and local drafts remain; account drafts and public list/detail/create/edit/publish/unpublish/delete are implemented with ownership checks, pagination and RLS. Actual old posts have not been imported. |
| `/chat` | Same route | Restored guided keyword help with feature links. The original `chatutils.js` was deterministic, despite UI labels saying AI/LLM; the rebuild does not make that claim. |
| `/faq` | Same route | Expandable questions with accurate availability and feature links. |
| `/about` | Same route | Project purpose, ownership and actual capabilities. |
| `/user_protection` | Same route | Accurate privacy/storage/provider information. Unsupported old encryption/audit claims are not carried forward. |
| `/profile`, `/login`, `/sign-up` | Redirect to `/account` | Supabase registration, sign-in/out, confirmation resend, recovery/password change and profile editing are implemented. Configured service acceptance and old-account import remain separate. |
| `/subscription` | Redirect to `/pricing` | Stripe plans display actual configured prices; authenticated checkout, portal, signed/idempotent webhooks and live entitlement checks protect exports. Old Razorpay subscriptions are not automatically transferred. |

## Configuration and historical data boundary

The legacy local backend and embedded provider credentials are replaced by
Supabase, Stripe, configured stock data and public market/news adapters. Apply
the tracked migrations and follow SETUP.md. Browser-facing keys never include
service-role or Stripe secrets.

Code covers account/profile, cloud tracking, owned/public publishing, checkout,
verification, billing management and paid export behaviour. Offline tests include
actual SQL/RLS execution and real Stripe signature verification. Live email,
payment delivery and provider-plan acceptance still need configuration. Old
users, password hashes, saved assets and posts require a deliberate import and
identity mapping; retaining Git history does not migrate those records.

## Verification

- Production compilation and TypeScript checks.
- Focused tests for calculations, provider failure/data validation, RSS parsing
  and unsafe links, chart identifiers, redirect safety and guided-help answers.
- HTTP verification of deployed public routes, old URL redirects, health,
  news content and the hero canvas/module reference.
- Browser automation remains unavailable: actual WebGL rendering/performance,
  pointer interaction, speech playback, draft editing and third-party chart
  interaction require a browser acceptance pass. HTTP/build checks alone do
  not establish these behaviours.
- Live authentication, payment, cloud sync and publishing acceptance requires
  the documented services. SQL isolation and SDK boundary tests do not replace
  those external checks.
