# Accountio AI | AI Munshi — Web Application

**Tagline:** Accounting as a conversation.  
**Target Market:** Pakistani shopkeepers, traders, wholesalers, retailers, and small businesses.

## Overview

This is the standalone, frontend-first Next.js web application for **Accountio AI (AI Munshi)**. It runs completely in **Demo Mode** using a persistent local **IndexedDB (Dexie.js)** database seeded with a realistic fictional Pakistani business (**Al Madina Yarn Traders**, Chiniot Bazar, Faisalabad).

No external API keys, WhatsApp credentials, AI provider keys, or external databases are required.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 + Radix UI primitives + Lucide Icons
- **State & Data:** Zustand + TanStack Query + Dexie.js (IndexedDB)
- **Charts & Exports:** Recharts + jsPDF + SheetJS (`xlsx`)
- **Localization:** English (LTR) + Urdu (RTL) + Roman Urdu conversational flows
- **Testing:** Vitest + React Testing Library + fake-indexeddb + Playwright

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials
- **Instant Demo Login:** Click *"Instant Demo Login (Al Madina Yarn)"* on `/login`, or
- **Simulated OTP Login:** Enter `+92 300 8664123` and OTP `123456` on `/verify-otp`.

## Scripts

- `pnpm dev` — Start development server
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — Run TypeScript compiler check
- `pnpm test` — Run unit & integration tests (Vitest)
- `pnpm test:e2e` — Run Playwright end-to-end tests
- `pnpm build` — Production Next.js build
- `pnpm start` — Start production server

## Documentation Index

- [Architecture](docs/ARCHITECTURE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Routes](docs/ROUTES.md)
- [Demo Accounting Rules](docs/DEMO_ACCOUNTING_RULES.md)
- [Future API Integration](docs/API_INTEGRATION.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
