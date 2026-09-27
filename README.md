# Charitable - Modern Philanthropy Platform

## Overview

Charitable is a mobile-first social media-style philanthropy platform that connects donors with nonprofits through a scrollable feed. Nonprofits create profiles and post fundraising campaigns that appear in users' feeds. All donations flow directly to nonprofit bank accounts via Stripe Connect destination charges. The platform is designed to be simple enough for non-tech-savvy nonprofits to use.

## System Architecture

### Monorepo Structure
The project is organized as a monorepo with:
- `client/` - React web app (Vite, served from Vercel's CDN)
- `server/` - Express backend (runs as a Vercel Function via `api/index.ts`)
- `api/` - Vercel Function entry point
- `shared/` - Database schemas (Drizzle ORM)
- `apps/mobile/` - React Native mobile app (run locally with Expo)
- `packages/shared/` - Shared types and API client for mobile

### Web Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite

The web frontend follows a page-based structure with shared components. Key pages include:
- Home, Feed, Browse (Discover), How It Works, For Nonprofits (public pages)
- Nonprofit Profile, Dashboard, Onboarding (nonprofit-specific)
- Donation Success (post-payment confirmation)

Key components:
- BottomNav: Mobile bottom navigation for app-like experience
- Header: Desktop/tablet navigation with Feed/Discover links
- PostCard: Feed item showing nonprofit post with like/donate actions

### Mobile App Architecture (apps/mobile/)
- **Framework**: Expo (managed React Native)
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **Data**: TanStack React Query + shared API client

Mobile screens:
- Feed tab: Scrollable posts with likes and donate buttons
- Discover tab: Grid of nonprofit cards
- Profile tab: Guest/user profile
- Nonprofit detail: Full profile with campaigns
- Donate modal: Amount selection, opens Stripe Checkout

To run the mobile app locally:
1. `cd apps/mobile && npm install`
2. Set `EXPO_PUBLIC_API_URL` to your deployed backend URL
3. `npx expo start` and scan QR with Expo Go app

### Backend Architecture
- **Runtime**: Node.js 24 with Express
- **Entry points**: `server/app.ts` builds the Express app; `api/index.ts` exports it as a Vercel Function and `server/index.ts` runs it locally
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON endpoints under `/api/*`

The server handles:
- Nonprofit CRUD operations
- Donation processing via Stripe Checkout
- Webhook processing for payment confirmation

### Data Storage
- **Database**: PostgreSQL (Neon, via the Vercel Marketplace)
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)

Main entities:
- `users` - Basic user accounts
- `nonprofits` - Organization profiles with donation stats
- `donations` - Individual donation records with status tracking
- `posts` - Fundraising posts created by nonprofits (with goals, progress)
- `supporters` - Donor profiles with giving history
- `follows` - Relationships between supporters and nonprofits
- `reactions` - Likes on posts from supporters or guests

### Payment Processing
- **Provider**: Stripe (Checkout + Connect destination charges)
- **Flow**: Stripe Checkout Sessions → Webhook confirmation → Database update
- **Webhook**: `POST /api/stripe/webhook`, listening for `checkout.session.completed`. Registered once in the Stripe Dashboard/CLI; its signing secret lives in `STRIPE_WEBHOOK_SECRET`.

## Development

1. `npm install`
2. `vercel link`, then `vercel env pull .env.local` to get `DATABASE_URL`
3. Add Stripe **test** keys to `.env.local` (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`). Production keys are marked sensitive on Vercel and aren't pulled.
4. `npm run dev` — serves the app and API on http://localhost:5000
5. To receive webhooks locally: `stripe listen --forward-to localhost:5000/api/stripe/webhook`, and put the `whsec_` it prints in `STRIPE_WEBHOOK_SECRET`

Schema changes: edit `shared/schema.ts`, then `npm run db:push` (uses `DATABASE_URL` from `.env.local`).

## Deployment

Hosted on Vercel at https://charitable3.vercel.app. Pushes to `main` deploy to production; other branches get preview deployments. Configuration is in `vercel.json`.

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing for donations (Checkout, Webhooks)
- **Vercel**: Hosting (static client + Express as a Vercel Function)
- **Neon**: PostgreSQL database
- **Google Fonts**: Inter font family for typography

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `stripe`: Payment integration
- `@tanstack/react-query`: Data fetching and caching
- `@radix-ui/*`: Accessible UI primitives (via shadcn/ui)
- `wouter`: Client-side routing
- `zod`: Schema validation shared across client/server

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (set by the Neon integration)
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY`: Stripe API keys
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the `/api/stripe/webhook` endpoint
