# Deploying to Vercel

## 1. Supabase

Create a project, then copy both connection strings from the dashboard **Connect** dialog. The app uses transaction mode at runtime and session mode for migrations.

| Variable | Connect tab | Host | Port |
| --- | --- | --- | --- |
| `DATABASE_URL` | Transaction pooler, append `?pgbouncer=true` | `aws-<n>-<region>.pooler.supabase.com` | 6543 |
| `DIRECT_URL` | Session pooler | `aws-<n>-<region>.pooler.supabase.com` | 5432 |

Do not point `DIRECT_URL` at the direct `db.<ref>.supabase.co` endpoint. On the free tier that host resolves over IPv6 only, and Vercel builds run on IPv4, so `prisma migrate deploy` fails with an unreachable database. Both pooler endpoints are IPv4 on every tier.

Copy the hostname from the dashboard rather than assembling it by hand; the `aws-<n>` prefix varies between projects.

Two further steps:

- **Storage** — create a bucket named exactly `property-files` and keep it private. Files are served through signed URLs, so public access is never required.
- **Auth email template** — login verifies a six digit code, not a magic link. The default Supabase template only sends `{{ .ConfirmationURL }}`, so edit the Magic Link template to include `{{ .Token }}`. Without this, users receive a link that the verify screen cannot accept. Set the Site URL to your production domain.

## 2. Stripe

Create the Pro product with a monthly and an annual price. Add a webhook endpoint at `https://<your-domain>/api/stripe/webhook` subscribed to the events the handler implements:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 3. Environment variables

Set these on Vercel for Production, and for Preview if preview deployments should be usable.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase pooler URL |
| `DIRECT_URL` | Supabase direct URL |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | `price_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL` | `price_...` |
| `CRON_SECRET` | Long random string |
| `STRIPE_PAYMENT_METHODS` | `card` (optional) |
| `FEATURE_PHONE_OTP` | `false` (optional) |

`NEXT_PUBLIC_APP_URL` is validated as a URL during the build, so a missing or malformed value fails the build rather than the deploy. Set it before the first build, using the `<project>.vercel.app` URL if a custom domain is not ready yet.

Never set `MOCK_THIRD_PARTY`, `E2E_MOCKS`, or `NEXT_PUBLIC_E2E` on Vercel. Mock mode accepts `000000` as a valid login code for any address, so the guard in `src/lib/mock/enabled.ts` throws whenever `VERCEL_ENV` is present.

## 4. Migrations

`vercel.json` sets the build command to `prisma migrate deploy && npm run db:seed && npm run build`, so every deploy applies migrations and refreshes reference data.

The seed is safe to run against production. It inserts no demo users or properties, only the expense categories and renovation presets the app requires, and every row is an upsert keyed on a unique `key`. Skipping it leaves the cost and renovation features with nothing to select.

Because migrations run at build time, a Preview deployment migrates whichever database its own `DIRECT_URL` points at. Give previews a separate database, or leave the preview environment variables unset so previews do not build.

## 5. Cron

The daily recurring expense job is declared in `vercel.json` and runs at 09:00 UTC. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically, which is what `/api/cron/recurring` checks, so it works as soon as `CRON_SECRET` is set. Daily frequency stays within Hobby plan limits.

## 6. Verify

- `GET /api/health` performs a database round trip.
- Sign in with a real address to confirm the OTP email template change.
- Send a test webhook from Stripe to confirm the signature verifies.

## Performance note

Set the Vercel function region to match the Supabase region. Every query pays a cross region round trip otherwise. This is configured in **Project Settings → Functions**, or by adding a `regions` entry to `vercel.json`.
