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

## Getting started

```bash
npm install
cp .env.example .env   # fill in a real ANTHROPIC_API_KEY
npx prisma migrate dev # creates the local SQLite dev database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run typecheck` — TypeScript, no emit
- `npm run test` — Vitest unit + API integration tests
- `npm run lint` — ESLint

## Environment variables

See [.env.example](.env.example). `ANTHROPIC_API_KEY` and `DATABASE_URL` are
validated eagerly at startup by `src/lib/config.ts` — the app fails loud
with a clear message if either is missing.

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

CSV export, multi-user auth, attaching a doctor's letter/prescription, push
notifications, multi-currency. The layered architecture is designed so each
of these can be added later without touching the core services.
