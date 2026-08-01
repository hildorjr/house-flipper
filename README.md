# House Flipper

SaaS for Brazilian property flippers to track acquisition, renovation, holding, financing, and sale costs — with a pre-buy deal calculator.

## Stack

- Next.js 16 (App Router) on Vercel
- Supabase Auth + Postgres + Storage
- Prisma 7
- Stripe subscriptions (BRL)
- next-intl (`pt-BR`, `en`)

## Local mock mode

Set `MOCK_THIRD_PARTY=true` in `.env` to skip real third parties while keeping Postgres:

| Service | Mock behavior |
|---|---|
| Auth | Any email works. OTP code is always `000000` (also accepts `123456`). Session is a cookie. |
| Stripe | Checkout/portal redirect to local mock pages that flip Free ↔ Pro in the DB. |
| Storage | Files land in `.data/uploads/` via `/api/mock-storage/*`. |

Blocked automatically when `NODE_ENV=production`. An amber banner shows whenever mocks are on.

## Setup

1. Copy `.env.example` to `.env` (mock mode is on by default for local). Set both `DATABASE_URL` (pooled, used at runtime) and `DIRECT_URL` (direct connection, used by migrations and `prisma.config.ts`).
2. Install dependencies: `npm install`
3. Generate Prisma client: `npx prisma generate`
4. Apply migrations: `npm run db:migrate`
5. Seed categories/presets: `npm run db:seed` — required, the expense and category flows depend on the system categories
6. Install the Playwright browser once before running e2e: `npx playwright install chromium`
7. Run: `npm run dev`

### Required env

Validated at boot by `src/env.ts` through the `instrumentation.ts` register hook, so a missing variable fails startup instead of the first request. `DATABASE_URL`, `DIRECT_URL` and `NEXT_PUBLIC_APP_URL` are always required. Supabase keys, Stripe keys and `CRON_SECRET` are only required when `MOCK_THIRD_PARTY` is not `true`. Turn `MOCK_THIRD_PARTY=false` and fill real keys when integrating third parties.

Server-only values live behind `serverEnv()`; `clientEnv` exposes the `NEXT_PUBLIC_*` values only, so no secret reaches the browser bundle.

### Scripts

- `npm run dev` — local server
- `npm run build` — prisma generate + next build
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — vitest (finance/money)
- `npm run check:prisma-boundary` — fail if `prisma.` leaks outside `src/server/data`
- `npm run ci` — typecheck + lint + prisma boundary + unit tests
- `npm run db:reset` — drop, re-migrate and re-seed the database
- `npx playwright test` — smoke e2e against `npm run dev`

### Health check

`GET /api/health` returns `{ ok: true }` after a database round-trip, and `503` when the database is unreachable.

### E2E in CI

`npx playwright test` locally still starts `npm run dev`. When `CI` is set, the Playwright `webServer` starts `npm run start` instead and injects `MOCK_THIRD_PARTY`, `NEXT_PUBLIC_E2E` and `NEXT_PUBLIC_APP_URL` so the suite runs against the production build. The mock "Preencher formulário" buttons render when `NODE_ENV=development` **or** `NEXT_PUBLIC_E2E=true`; the flag must be set at build time because it is inlined into the client bundle.

Next.js inlines `process.env.NODE_ENV` as `production` into every production bundle, so `isMockThirdParty()` in `src/lib/mock/enabled.ts` still refuses to enable mocks against `npm run start`. Running mocked e2e on a production build requires that guard to accept the same explicit test flag (`NEXT_PUBLIC_E2E === "true"`).

## Product notes

- Free plan: 1 editable property. Extra properties become read-only (never deleted).
- Money is stored as integer cents.
- Loan principal repayments are excluded from total cost; only interest + fees count.
- Renovation preset BRL unit prices are placeholders — review before production marketing.
