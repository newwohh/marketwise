# Browser acceptance status

## Attempt and limitation

The browser QA agent attempted one fresh shared-browser launch against
`https://marketwise.bynevin.dev` after reading the Browser and Cloud Desktop
skills and checking for Chrome-extension tools. No extension control tool was
exposed in this chat. The native shared browser failed before opening the page:

> the gaas-browser node_repl sandbox cannot be disabled

The required browser completion summary was emitted. No shell browser,
Playwright installation, local server, credential change, or unsupported browser
fallback was used. This is an environment startup limitation; it is not evidence
that the Marketwise UI passes or fails the checks below.

## Still requires an actual browser pass

| Area | Acceptance action | Current result |
| --- | --- | --- |
| 3D landing hero | Observe rendered sculpture, rotation, pointer response, pause/resume, reduced-motion fallback and context-loss behaviour | Not browser-verified |
| Responsive navigation | Open and close mobile menu; follow all navigation links; check narrow widths and keyboard focus | Not browser-verified |
| Market workspace | Search, sort, star/unstar, reopen watchlist, open/close details, switch markets and views | Not browser-verified |
| Simulator | Change amount, asset units, monthly contributions, years and return; reset and test invalid inputs | Not browser-verified |
| Guided help | Submit a topic and follow the suggested feature link | Not browser-verified |
| Notebook | Create/edit/save/reopen/download/delete a device-local draft | Not browser-verified |
| Academy speech | Listen, pause, resume and stop; verify unsupported-browser behaviour | Not browser-verified |
| TradingView | Load a chart, change symbol/interval/indicator and use the external fallback link | Not browser-verified |
| Configured accounts and services | Complete signup/login/recovery, account isolation, cloud sync, publishing, Stripe test checkout and cancellation | Requires provider configuration and browser acceptance |

Build, unit, source-review, and HTTP results are recorded separately. They must
not be described as a replacement for these interactive acceptance checks.
