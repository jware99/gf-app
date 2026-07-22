# Crumb Trail

A receipt tracker for people with celiac disease. Photograph a grocery
receipt, flag the gluten-free items, estimate the extra cost over the
regular equivalent product, and track the running total against the IRS
7.5%-of-AGI medical-expense floor.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS · Prisma (SQLite dev /
Postgres-ready for prod) · Zod · Anthropic TypeScript SDK · Vitest.

## Architecture

UI components → API routes (`src/app/api/**`) → services
(`src/lib/services/**`) → provider/repository interfaces
(`src/lib/ai/ai-provider.ts`, `src/lib/db/receipt-repository.ts`).

Route handlers and services never import the concrete `AnthropicProvider` or
`PrismaReceiptRepository` classes directly — they resolve them by interface
from `src/lib/container.ts`. Swapping the AI provider or the database means
writing one new file that implements the relevant interface, plus a
one-line change in the container.

Auth.js config is split in two for Edge compatibility: `src/lib/auth.config.ts`
(providers + the `authorized` callback, no Prisma — safe for
`src/middleware.ts`, which runs on the Edge runtime) and `src/lib/auth.ts`
(adds the Prisma adapter, JWT session strategy, and the first-login claim
hook — Node-only, used by route handlers and the NextAuth route handler).

## Getting started

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET
npx prisma migrate dev # creates the local SQLite dev database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to
`/login`. See [Authentication](#authentication) below to set up Google
sign-in before the app is usable.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run typecheck` — TypeScript, no emit
- `npm run test` — Vitest unit + API integration tests
- `npm run lint` — ESLint

## Environment variables

See [.env.example](.env.example). `ANTHROPIC_API_KEY`, `DATABASE_URL`,
`AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are all validated
eagerly at startup by `src/lib/config.ts` — the app fails loud with a clear
message if any is missing.

## Authentication

Sign-in is Google-only, via [Auth.js v5](https://authjs.dev/) with the
Prisma adapter. Every route (pages and API) is protected by
`src/middleware.ts`; signed-out visitors are redirected to `/login`. Once
signed in, `session.user.id` scopes every receipt/AGI read and write —
there's no cross-user data access.

**Any pre-auth receipts and AGI settings you already have (rows with a
`null` userId) are automatically claimed by whichever account signs in
first** — a one-time migration, not something that happens on every login.

### Google Cloud Console setup (one-time, per environment)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   and create (or select) a project.
2. **APIs & Services → OAuth consent screen** — configure it (External is
   fine for personal use; add yourself as a test user if it stays in
   "Testing" status).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   — Application type: **Web application**.
4. Under **Authorized redirect URIs**, add:
   - Local dev: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-domain>/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client secret** into `.env` as
   `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
6. Generate `AUTH_SECRET` (a random string used to sign session cookies):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
7. In production, also set `AUTH_URL` to your deployed URL — Auth.js can't
   always infer it from the request behind some proxies/CDNs.

## Installable PWA

The app ships a manifest (`public/manifest.webmanifest`) and a minimal
service worker (`public/sw.js`) that caches the app shell, so it can be
installed to a phone's home screen directly from the browser (no app-store
step).

If a native App Store / Play Store build is wanted later, the next step is
wrapping this same Next.js build with [Capacitor](https://capacitorjs.com/) —
that has intentionally not been done yet, but nothing in this codebase
blocks it.

## Out of scope for v1

CSV export, non-Google sign-in providers, attaching a doctor's
letter/prescription, push notifications, multi-currency. The layered
architecture is designed so each of these can be added later without
touching the core services.
