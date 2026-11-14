# Original Marketwise feature audit

This audit compares the original frontend at `/workspace/marketwise-original`
with the new project. A reachable route does not establish backend integration
parity. Account-dependent features remain incomplete until their real services
are connected and tested.

## Routes and behaviour

| Original route or feature | Rebuild destination | Status and limits |
| --- | --- | --- |
| `/` marketing homepage | `/` | Rebuilt in the North-inspired style; original reflective 3D sculpture, slow rotation, pointer response, pause control, lazy loading, offscreen suspension, reduced-motion/WebGL fallback. |
| `/cryptocurrency` | Same route or `/markets` | Search, sorting, price, 24h and 7d changes, market cap, volume, seven-day charts, browser watchlists. CoinGecko provider/fallback status is explicit. |
| `/stocks` | Same route | Stock overview is explicitly illustrative. Real third-party chart pages are available; a licensed stock quote API is not connected. The original stock API calls used embedded credentials and mixed reference data with prices. |
| Forex section/menu | `/forex` | Added a working direct route; daily Frankfurter/ECB USD reference rates. No invented intraday changes. |
| `/cryptocurrency/chart/:id` | Same route | Restored TradingView technical chart embedding, symbol changes, intervals and provider controls. Supports common named coins, CoinPaprika IDs, tickers and explicit exchange symbols. Browser operation of third-party widget remains unverified. |
| `/heatmap/cryptocurrency` | Same route | Crypto heatmap with positive/negative intensity and asset details. |
| `/heatmap/stocks` | Same route | Public illustrative stock heatmap; user-specific authenticated heatmap data is not connected. |
| Asset “subscribe” action | Browser watchlist | Functional device-local tracking. Previous backend subscriptions, cross-device sync and account isolation are not migrated. |
| Crypto and stock news sections | Market sections and `/news` | Original publisher RSS headlines from CoinDesk/MarketWatch with dates and source links; explicit feed outages. No old API credentials copied. |
| `/investsimulator` | Redirect to `/simulator` | Amount mode and restored asset/quantity mode; annual rate, years, initial capital, modelled value/gain, chart. Adds monthly contributions and correct zero/negative-return handling. Not historical backtesting or order execution. |
| `/education` | Redirect to `/learn` | Modules cover trading, broker accounts, market reading, technical analysis, practice, risk, compounding and diversification. Restored browser-native read-aloud, pause and stop. Old module hash anchors retained on academy cards. |
| `/grow` | Same route | Rebuilt growth/learning pillars with direct links to research tools. |
| `/explore` | Same route | Complete product hub for crypto, stocks, forex, heatmaps, simulator, academy, news and blogs. |
| `/blogs` | Same route | Public editorial field notes and functional local draft title/body editor, save/edit/delete and text download. These drafts are not public posts. Previous backend posts and publishing remain unconnected. |
| `/chat` | Same route | Restored guided keyword help with feature links. The original `chatutils.js` was deterministic, despite UI labels saying AI/LLM; the rebuild does not make that claim. |
| `/faq` | Same route | Expandable questions with accurate availability and feature links. |
| `/about` | Same route | Project purpose, ownership and actual capabilities. |
| `/user_protection` | Same route | Accurate privacy/storage/provider information. Unsupported old encryption/audit claims are not carried forward. |
| `/profile`, `/login`, `/sign-up` | Redirect to `/account` | Availability page prevents dead navigation, but authentication/profile management is NOT implemented or migrated. No fake sign-in form or user record is created. |
| `/subscription` | Redirect to `/pricing` | Working availability page showing the actual free public tools. Previous Starter/Basic/Premium plans and Razorpay checkout are NOT migrated or active. |

## Existing backend dependencies that still block parity

The old frontend defaulted to `http://127.0.0.1:5050/`. Its authentication,
asset subscriptions, blogs and Razorpay requests require a separate service.
No production endpoint, account database or migration has been configured for
the rebuild. The Vercel integration list remains empty. The proposed new
authentication and Stripe setup is not an existing working integration.

Still required: verified registration/login/logout/recovery, profiles,
account-scoped persistent watchlists, old-user/content migration, public blog
publishing and subscription checkout/verification/management. Pro CSV export
returns an explicit unavailable response rather than exposing an ungated paid
feature or a generic 404.

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
- Authentication, payment, cloud sync and publishing cannot pass acceptance
  until their services are provisioned.
