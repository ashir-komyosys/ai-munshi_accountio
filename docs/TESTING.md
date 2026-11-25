# Testing & Deployment

- **Unit & Integration:** `pnpm test` (Vitest + `fake-indexeddb`)
- **E2E:** `pnpm test:e2e` (Playwright across desktop Chromium and mobile Pixel 5)
- **Typecheck & Lint:** `pnpm typecheck && pnpm lint`
- **Docker:** `docker compose up --build`
