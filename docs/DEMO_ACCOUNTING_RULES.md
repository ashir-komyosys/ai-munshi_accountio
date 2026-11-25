# Demo Accounting Rules

- **Monetary Arithmetic:** Minor-unit integer paisa (`src/lib/money.ts`) prevents floating-point drift.
- **Double-Entry Journals:** Every posted transaction generates balanced debit/credit rows in `journalEntries`.
- **Reversals:** Posted transactions cannot be silently deleted; `reverseTransaction()` creates a counter-entry with an audit link.
- **Profit & Loss:** Uses Cost of Goods Sold (COGS) rather than total purchases.
- **Transfers:** Internal cash/bank/wallet transfers update account balances without inflating revenue or expenses.
- **Inventory Costing:** Uses weighted-average cost on incoming stock (`computeWeightedAverageCost`).
