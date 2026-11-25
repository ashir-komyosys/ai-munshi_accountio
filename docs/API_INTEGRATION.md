# Future API Integration Guide

1. Keep `src/services/contracts/index.ts` unchanged.
2. Create live HTTP adapters in `src/services/live/` implementing the same TypeScript interfaces (`AuthService`, `ChatService`, `BooksService`, `KhatasService`, `TransactionsService`, `InventoryService`, `CashBankService`, `LoansService`, `ReportsService`, `DocumentsService`, `NotificationsService`, `SettingsService`, `SubscriptionService`).
3. Swap the exported adapters in `src/services/index.ts` based on `NEXT_PUBLIC_DEMO_MODE`.
4. Chat messages already use stable `clientMessageId` for idempotent retries and stable `option.id`s for interactive card actions.
