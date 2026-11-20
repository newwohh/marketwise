# Marketwise repository guide

This branch is the independent Next.js/TypeScript rebuild of the original React
frontend. Preserve its North-inspired charcoal/lilac design and original 3D hero.

## Commands

- Node.js 24 LTS; install with `npm ci`.
- Develop: `npm run dev`.
- Verify: `npm test`, `npm run build`, `npm run typecheck`.
- Never commit `.env.local`, `.next`, `node_modules`, provider credentials, or
  generated payment/customer data.

## Feature ownership and contracts

- `src/lib/markets.ts`: fixed upstream provider adapters and explicit demo fallbacks.
- `src/lib/model.ts`: validated financial calculations and quote contracts.
- `src/lib/hero-scene.ts`: GPU resource lifecycle; keep reduced-motion fallback.
- `src/lib/auth.ts`, Supabase helpers and `src/app/auth/`: validated account identity.
- Account identity must come from server-validated authentication, never a client user ID.
- Content/watchlist APIs must enforce ownership and keep database RLS enabled.
- Billing must validate signatures, configured price IDs and subscription period;
  a checkout redirect or browser flag is never proof of payment.
- `supabase/migrations/`: review and apply to the intended project before using accounts.
- `FEATURE_PARITY.md` records the legacy route/feature comparison. Keep it accurate.

## Verification and deployment

Use focused regression tests for behaviour changes. Public HTTP checks do not
establish browser WebGL, speech, authentication, payment or database behaviour.
Report configure-later providers separately from features verified end to end.
Use atomic commits grouped by feature and retain legacy routes/history. Do not
overwrite the original default branch or force-push shared branches.
