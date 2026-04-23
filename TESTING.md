# Testing Guide

This project uses **Vitest** for unit tests and **Playwright** for deterministic E2E tests.

## Unit tests

```bash
npm run lint
npm run test -- --run
```

## Deterministic E2E (local)

### 1) Configure env vars

Create `.env.local` from `.example-env` and ensure these values are set:

- `MONGODB_URI`
- `AUTH_SECRET`
- `PAYPAL_CLIENT_ID` (sandbox)
- `PAYPAL_APP_SECRET` (sandbox)
- `PAYPAL_API_URL=https://api-m.sandbox.paypal.com`
- `STRIPE_SECRET_KEY` (sandbox/test key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (sandbox/test key)
- `STRIPE_WEBHOOK_SECRET` (sandbox webhook secret)

### 2) Start MongoDB

Use local MongoDB or Docker.

Example with Docker Compose (Mongo only):

```bash
docker compose up -d mongo
```

### 3) Reset/seed deterministic E2E data

```bash
npm run seed:e2e
```

This seed resets data to a lean deterministic dataset with:

- `admin@example.com / 123456`
- `vendor@example.com / 123456`
- `user@example.com / 123456`
- approved vendor profile + published products
- webhook analytics sample events for admin webhooks UI tests

### 4) Run E2E

```bash
npm run e2e
```

Playwright runs all E2E tests from `tests/e2e` and generates role storage states in:

- `storage/user.json`
- `storage/vendor.json`
- `storage/admin.json`

### 5) CI-mode local run (Chromium only)

```bash
npm run e2e:ci
```

## E2E matrix covered

- Guest: home, search, product details, cart add/update/remove
- User: sign-in/sign-out, checkout flow, Stripe sandbox payment confirmation, order history, RBAC checks
- Vendor: dashboard access, create product, RBAC checks
- Admin: dashboard and core admin pages
- Webhooks: admin analytics/log filtering/pagination, vendor webhook subscription UI

## Notes

- E2E tests are unified under `tests/e2e`.
- Legacy top-level `e2e/` specs were removed to avoid duplicate/confusing execution.
- Use `PLAYWRIGHT_ALL_BROWSERS=true npm run e2e` to run Firefox/WebKit in addition to Chromium.
