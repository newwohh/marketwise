# Repository guide

## Structure

This is a CommonJS Node.js API using Express, Mongoose, JWT cookies, and Razorpay.
`server.js` connects MongoDB and starts the listener; `app.js` configures middleware and routes.
Request flow: `routes/` → `controllers/` → `models/`. Shared middleware lives in
`middlewares/`; response and async helpers live in `utils/`.

## Setup and checks

- Install dependencies with `npm ci` and start from the repository root with `npm start`.
- Configuration is loaded from `config/config.env`. Required settings include
  `DATABASE`, `DATABASE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES`,
  `JWT_COOKIE_EXPIRES_IN`, `RAZRPAY_ID`, and `RAZRPAY_SECRET`.
- The port setting is lowercase `port`, defaulting to 5050. MongoDB must be reachable
  for database routes; use development credentials and Razorpay test mode locally.
- Run `npm test` for the database-free HTTP regression check. No formatter or build step is configured. Check changed JavaScript with
  `node --check <file>` and module loading with `node -e 'require("./app")'`.
  These checks do not verify database, authentication, or payment behavior.
- For behavior changes, add the smallest runnable regression check and report what
  was actually verified.

## Working conventions

- Keep CommonJS, two-space indentation, and existing route/controller/model patterns.
- Trace callers before editing shared functions; reuse existing helpers and keep changes focused.
- Use Node.js >=20.19.0 for Express 5 and Mongoose 9. The app snapshots `req.query`
  as a writable property for the existing sanitizers. Keep its regression check passing.
- Preserve existing public routes, including `/api/v1/subscrptions/`, unless a route
  migration is explicitly requested.
- Never print or commit credentials. `config/config.env` is already tracked upstream;
  the ignore rule does not untrack it. Do not copy its values into documentation or tests.
- Do not exercise live payments or modify remote database records during setup checks.
