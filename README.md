# Crumb Trail

A receipt tracker for people with celiac disease. Photograph a grocery
receipt, flag the gluten-free items, estimate the extra cost over the
regular equivalent product, and track the running total against the IRS
7.5%-of-AGI medical-expense floor.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS · Prisma (Postgres, via
[Neon](https://neon.tech), for both dev and prod) · Zod · Anthropic
TypeScript SDK · Vitest.

Dev and prod are separate Postgres databases (Neon branches) rather than
SQLite-locally/Postgres-in-prod — Prisma can't share one migration history
across two different SQL dialects, so using the same engine everywhere
avoids dev/prod drift. See [Deploying to production](#deploying-to-production).

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
cp .env.example .env   # fill in ANTHROPIC_API_KEY, DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET
npx prisma migrate dev # applies migrations to your Postgres dev database
npm run dev
```

`DATABASE_URL` needs a real Postgres connection string even for local dev —
the free tier of [Neon](https://neon.tech) works well; create a project and
use its connection string (or a separate branch, so dev and prod data stay
apart — see [Deploying to production](#deploying-to-production)).

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

## Deploying to production

Hosted on [Vercel](https://vercel.com), database on [Neon](https://neon.tech)
(Postgres). One-time setup:

### 1. Database (Neon)

Create a free Neon account and one project. Its default branch is your
**production** database; add a second branch (e.g. named `dev`) for local
development — same schema, isolated data, no separate account needed.
Copy each branch's connection string.

### 2. Push to GitHub

This repo needs to live on GitHub for Vercel's auto-deploy-on-push flow.
`gh repo create` (or the GitHub web UI) + `git push` is all that's needed —
no GitHub Actions/CI config required for a basic deploy.

### 3. Vercel project

Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel
auto-detects Next.js — no build command overrides are needed since
[package.json](package.json)'s `build` script already runs
`prisma migrate deploy` before `next build`, and `postinstall` runs
`prisma generate`, so every deploy applies pending migrations and
regenerates the Prisma client automatically.

Set these environment variables in the Vercel project's settings
(**Production** scope — use a *different* `AUTH_SECRET` than local dev):

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | same as local |
| `ANTHROPIC_MODEL` | same as local |
| `DATABASE_URL` | Neon **production** branch connection string |
| `AUTH_SECRET` | a newly generated secret (see command in [Authentication](#authentication)) — don't reuse the local one |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | same Google OAuth client as local |
| `AUTH_URL` | your production domain, e.g. `https://<project>.vercel.app` |

### 4. Google Cloud Console — add the production redirect

The same OAuth client used for local dev works in production — just add
its production URLs alongside the existing `localhost` ones (**Credentials**
→ your OAuth client):

- **Authorized redirect URIs**: add `https://<your-domain>/api/auth/callback/google`
- **Authorized JavaScript origins**: add `https://<your-domain>` (no path,
  no trailing slash)

If the OAuth consent screen is still in **Testing** status, only accounts
added as test users can sign in — move it to **Production** (or add every
family member's Google account as a test user) before anyone besides you
tries to sign in.

### 5. First deploy

Push to `main` (or click **Deploy** in Vercel). Sign in with Google
yourself first — this claims any pre-existing unclaimed data (see
[Authentication](#authentication)) onto your account. Everyone who signs in
after that gets their own empty ledger.

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
