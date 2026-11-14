# Deployment record

- Vercel team: `team_J7WTg0FG3OVZYzLSXIS0xThI`
- Project: `prj_iDE7V9G3hHdJKsfmbHVy4n3W2TxY` (`marketwise`)
- Deployment: `dpl_3gt8xJqUPPjYEvWUBRrUdQn9jyGC`
- Source revision: `1ed54be6d552abe99b204a554611718660f31b0d`
- Framework/runtime: Next.js / Node.js 24
- Vercel target/status: production / READY
- Stable alias: https://marketwise-virid.vercel.app
- Custom domain: https://marketwise.bynevin.dev
- Exact deployment: https://marketwise-nos0t522w-hellonevo13-4090s-projects.vercel.app

Deployment protection remains enabled for Vercel hostnames. The account owner
can sign in to view them. This is a review build with account and billing flows
still incomplete. Do not treat a READY build as proof of complete product flows.

## Verified HTTP behaviour

The 3D-hero/public-feature release passed all 31 hosted route, redirect and API
checks. See `verification/public-http.json`. Homepage HTML includes the new hero
canvas and lazy-loaded client component. The live news page returned 16
publisher headlines. Vercel reported no runtime error clusters in the recent
15-minute scan. No log drains are configured. These checks do not establish
WebGL rendering, speech, notebook editing, or TradingView browser interactions.

Prior-release checks:

Authenticated Vercel fetches returned HTTP 200 for `/`, `/api/health`, and
`/api/markets?market=forex`. The forex endpoint returned provider data from
Frankfurter / ECB dated 2026-11-13 with no fabricated history or daily changes.
Visual browser QA remains blocked by the unavailable browser environment.

## Custom domain

`marketwise.bynevin.dev` is attached to the project and Vercel reports ownership
verified. The user configured its Cloudflare CNAME and disabled proxying. Public
DNS resolves to the recommended CNAME below; Vercel reports `misconfigured: false`.
HTTPS requests with certificate verification returned HTTP 200 for both `/`
(confirmed Marketwise homepage) and `/api/health` (confirmed service status `ok`).
The authoritative nameservers
are Cloudflare's `aiden.ns.cloudflare.com` and `jocelyn.ns.cloudflare.com`.

Vercel's recommended record for this exact project/domain is:

| Field | Value |
| --- | --- |
| Type | CNAME |
| Name (in the bynevin.dev zone) | marketwise |
| Target | bb35a45b288b0bc0.vercel-dns-017.com. |
| Proxy | DNS only |
| TTL | Auto |

No Cloudflare write access is connected; the user saved the DNS change manually.
Keep this subdomain DNS-only. Cloudflare proxying initially produced HTTP 525;
after it was disabled, DNS and HTTPS checks succeeded. No changes to the apex,
mail, or unrelated DNS records were requested.

## Remaining service provisioning

The Vercel account's installed integration list is empty. Authentication and
subscription services must be provisioned before their flows can be completed.
The deployment currently has no working account, checkout, billing portal,
cloud-watchlist, or Pro export endpoint. No real customer payments are enabled.

## Feature audit

See `FEATURE_PARITY.md` for the original-route comparison. Public routes and
tools have been restored, but account and billing parity is not complete.
