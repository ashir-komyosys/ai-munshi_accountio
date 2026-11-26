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
# AI Munshi multi-model setup

Copy `.env.example` to `.env.local`, then add provider keys and model IDs. The values below are server-only; do not use `NEXT_PUBLIC_` prefixes or commit `.env.local`.

```env
OPENROUTER_API_KEY=your_openrouter_key
AI_INTERPRETER_PROVIDER=openrouter
AI_INTERPRETER_MODEL=provider/model-id
AI_ACTION_PROVIDER=openrouter
AI_ACTION_MODEL=provider/model-id
AI_REVIEW_PROVIDER=openrouter
AI_REVIEW_MODEL=provider/model-id
```

The interpreter, action planner, and reviewer can use separate models. If all are hosted through OpenRouter, one OpenRouter key is enough. If a role uses Groq, add `GROQ_API_KEY` and set that role's provider to `groq`. Restart `pnpm dev` after editing environment variables. The first implementation supports AI chat plus confirmed book and khata create/update/archive/restore actions; khata deletion is blocked when transaction history exists. Chat and accounting data remain in this browser's IndexedDB, so this demo does not share data across browsers or users.

## AI data and action safety

When you send a message, the app sends the message, active book ID, and a limited business context to each configured provider. Context is minimized to book names/types/status, khata names/types, product names/SKUs/units/quantities, account names/types, and transaction IDs/particulars/types/status. Phone numbers, addresses, notes, account numbers, and balances are not intentionally included. Providers process the request under their own terms; do not use this demo with sensitive production records until you have reviewed those terms.

Models can only propose actions from the server allowlist. The browser validates the returned proposal and asks for confirmation before applying it to local IndexedDB. Khata deletion is refused if transaction history exists. Product removal is archive-only. Transaction reversal is a financial write and requires confirmation. The application does not impose a per-minute request quota; provider quotas, availability, and billing still apply. The AI endpoint returns 503 in production until real server-side user authentication and authorization are added. The current demo login is client-side and is not sufficient to protect a hosted endpoint.

