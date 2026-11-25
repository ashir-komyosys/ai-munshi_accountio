# Architecture

## Layered Design

```text
Frontend Components (src/app, src/components)
  ↓ TanStack Query + Zustand (UI state)
Typed Service Interfaces (src/services/contracts/index.ts)
  ↓ Service Registry (src/services/index.ts)
Mock Service Adapters (src/services/mock/*)
  ↓ Atomic Transactions
Local IndexedDB (src/database/db.ts via Dexie.js)
```

UI components never import `db` directly; all reads and mutations go through `services.*`.
