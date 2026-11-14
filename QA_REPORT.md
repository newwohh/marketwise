# Migration QA report

This report covers the public-page, market-data and 3D-motion review. Authentication,
billing and cloud content are being implemented and verified by separate agents.
The retained North-inspired visual direction is unchanged by this audit.

## Historical evidence reviewed

The original repository history is available through `origin/master`. The audit
reviewed the current original `AppRoutes.jsx` and the feature families introduced
by these commits:

- `14ab8e1`: crypto, stocks, forex, overview and chart layouts.
- `9238d7d`: heatmaps and investment simulator.
- `a4c7e63`: academy, growth and blogs.
- `5852b54`: sign-in, signup, profile, pricing, FAQ and about.
- `5ff4515`: messenger-style help.
- `d18ff56`: Razorpay integration and backend asset subscriptions.
- `869b7c1`: original hero video design.

Older chat scaffold `f33352f` contained only a greeting and a message parser that
logged text; the latest original `chatutils.js` uses keyword replies. There is no
historical working LLM integration to preserve. The rebuilt guided assistant is
appropriately labelled.

## Route and feature coverage

The route regression test derives paths from the old `AppRoutes.jsx` when that
checkout is present and retains a baseline contract in standalone checkouts.
Every original public route has a real rebuilt page or an explicit compatibility
redirect. This includes the nested crypto chart URL, both heatmaps, education,
growth, explore, protection, about, blogs, simulator, FAQ and help. Account and
plan redirects do not by themselves establish authenticated behaviour.

The rebuild also preserves the old academy read-aloud feature; restores selected
asset/quantity simulation; exposes technical charts and 24-hour/seven-day changes;
and supports browser watchlists and notebook drafts independently of cloud setup.
`FEATURE_PARITY.md` remains the detailed route-by-route comparison.

## Correctness findings addressed during this pass

1. **Forecast overflow:** finite extreme initial/contribution values could yield
   infinite portfolio values. The model now rejects non-finite results; focused
   regressions cover both compounding and contribution overflow.
2. **Malformed forex responses:** empty currency maps and impossible calendar
   dates could be labelled live. The adapter now rejects those responses while
   accepting valid leap days.
3. **Stock-provider gap:** the overview previously had no real-data configuration
   path. The parent implementation adds a server-only Finnhub adapter with
   explicit delay, missing-field and fallback semantics. Live provider acceptance
   still requires a configured API key and suitable provider plan.
4. **Partial hero initialization:** a later initialization failure could leak
   already-created GPU resources. `hero-scene.ts` now tracks resources as they are
   allocated and releases them after partial failure. It also disposes on render
   failure or context loss before showing the existing static fallback.

## 3D hero review

The geometry, materials, colours, light positions and motion remain unchanged.
The scene caps pixel density, throttles drawing, pauses offscreen/hidden work,
supports a pause control, and skips WebGL under reduced-motion preferences.

Mocked-renderer lifecycle tests verify:

- disposal after environment-generation failure;
- exactly-once GPU disposal and observer/listener cleanup;
- no duplicated render loop after pause/resume or offscreen transitions;
- cancellation and fallback signalling after a rendering error.

These are lifecycle tests, not visual WebGL acceptance. They do not establish
actual frame rate, lighting, appearance or touch behaviour on a real device.

## Verification and remaining acceptance

`npx vitest run tests/parity-qa.test.ts` passes **14 tests** after the fixes.
No production build was run by this audit agent to avoid competing with the
parent's final build.

No extension browser-control tool was available during discovery. Browser startup
had failed earlier in this environment, so this agent did not substitute an
unsupported shell browser. Desktop/mobile screenshots, real WebGL interaction,
speech playback and the third-party TradingView widget remain browser acceptance
items. CSS source review confirms responsive breakpoints and reduced-motion styles
but cannot prove visual quality.

The initial market selector used tab roles without a tabpanel or arrow-key
behaviour. The parent replaced those roles with ordinary pressed-button semantics,
preserving standard keyboard focus behaviour without claiming a tab widget.

Real Supabase account isolation, real Stripe test-mode webhook/checkout flow,
configured Finnhub quotes and old user/content data migration need external
configuration and acceptance beyond offline tests. Do not label those external
flows verified merely because their setup code compiles.
