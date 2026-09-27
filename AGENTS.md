# AGENTS.md

Guidance for coding agents (Codex, Claude Code, etc.) working in this repo. See `README.md` for product and architecture background.

## Layout

- `client/` — React 18 + Vite web app (Wouter, TanStack Query, Tailwind, shadcn/ui in `client/src/components/ui`)
- `server/` — Express API
  - `server/app.ts` — `createApp()` builds the Express app; all middleware and routes are registered here
  - `server/routes.ts` — API route handlers
  - `server/storage.ts` — database access (Drizzle)
  - `server/index.ts` — local entry only (`npm run dev` / `npm start`); not used on Vercel
- `api/index.ts` — Vercel Function entry; exports `createApp()`. `vercel.json` rewrites `/api/*` here
- `shared/schema.ts` — Drizzle tables + Zod insert schemas, used by client and server
- `apps/mobile/`, `packages/shared/` — Expo app and its API client. Separate installs; excluded from the Vercel deploy

## Commands

```bash
npm run dev      # app + API on http://localhost:5000 (needs .env.local)
npm run build    # vite build + bundle server/index.ts to dist/ (local prod only)
npm run check    # tsc
npm run db:push  # apply shared/schema.ts to DATABASE_URL in .env.local
```

There are no tests. Verify changes with `npm run check` and `npm run build`, and exercise affected API routes against `npm run dev`.

`npm run check` currently reports a few pre-existing type errors in `client/src/pages` (donation-success, feed, nonprofit-dashboard). Don't add new ones; server code must type-check cleanly.

## Rules that aren't obvious from the code

- **Server imports must use relative paths with `.js` extensions** (`import { storage } from "./storage.js"`, `from "../shared/schema.js"`). Vercel runs the function as native ESM without bundling, so extensionless imports and the `@shared/*` alias break in production even though they work under `tsx`/Vite. The `@/` and `@shared/` aliases are fine in `client/`.
- **Keep `createApp()` synchronous and side-effect free.** It runs on every cold start of a serverless function. No `listen()`, no startup migrations, no background jobs, no in-memory state that must persist between requests.
- **The Stripe webhook route (`POST /api/stripe/webhook`) uses `express.raw()` and must stay registered before `express.json()`** in `server/app.ts`, or signature verification fails.
- **Schema changes**: edit `shared/schema.ts`, then `npm run db:push`. There is no migrations folder. `.env.local` points at the real Neon database, so review the diff drizzle-kit shows before confirming anything destructive.
- **Stripe keys on Vercel are live keys**, in both Production and Preview. Never run `stripe trigger` or create test charges against them. Use Stripe test keys in `.env.local` for local work.
- Stripe API version is pinned to `2025-08-27.basil` in `server/stripeClient.ts`; don't bump it casually.
- **`/api/admin/*` is protected by a shared password** (`server/adminAuth.ts`, mounted in `server/app.ts`): clients send `Authorization: Bearer <ADMIN_PASSWORD>`, and the client adds it automatically for `/api/admin` URLs via `adminHeaders()` in `client/src/lib/queryClient.ts`. Put new admin-only endpoints under `/api/admin/`. Other endpoints (e.g. nonprofit dashboard actions) have no auth.

## Environment

Local values live in `.env.local` (git-ignored; `vercel env pull .env.local` fetches `DATABASE_URL`). Required:

- `DATABASE_URL` — Neon Postgres
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` — only needed to process webhooks (`stripe listen --forward-to localhost:5000/api/stripe/webhook` prints one)
- `ADMIN_PASSWORD` — shared password for `/admin`; admin routes return 503 when unset

Never commit `.env*` files or print secret values.

## Deployment

Vercel project `charitable`, production at https://charitable3.vercel.app. Pushing to `main` deploys to production; other branches get preview URLs. Work on a branch and open a PR rather than pushing to `main` directly.
