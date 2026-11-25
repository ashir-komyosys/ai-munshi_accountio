import { db } from "./db";
import {
  buildSeedParties,
  buildSeedProducts,
  buildSeedTransactions,
  DEMO_ACCOUNTS,
  DEMO_ASSETS,
  DEMO_BILLING_HISTORY,
  DEMO_BOOKS,
  DEMO_BUSINESS,
  DEMO_CONVERSATIONS,
  DEMO_DOCUMENTS,
  DEMO_EMPLOYEES,
  DEMO_LOANS,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
  DEMO_SALARIES,
  DEMO_STOCK_MOVEMENTS,
  DEMO_USERS,
} from "@/mocks/fixtures/seedData";

export async function seedDemoDatabaseIfEmpty(): Promise<void> {
  const count = await db.books.count();
  if (count > 0) return;
  await populateAllSeedData();
}

export async function resetDemoDatabase(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.users,
      db.businesses,
      db.books,
      db.parties,
      db.accounts,
      db.transactions,
      db.lineItems,
      db.journalEntries,
      db.products,
      db.stockMovements,
      db.loans,
      db.employees,
      db.salaries,
      db.assets,
      db.documents,
      db.conversations,
      db.messages,
      db.notifications,
      db.billingHistory,
    ],
    async () => {
      await Promise.all([
        db.users.clear(),
        db.businesses.clear(),
        db.books.clear(),
        db.parties.clear(),
        db.accounts.clear(),
        db.transactions.clear(),
        db.lineItems.clear(),
        db.journalEntries.clear(),
        db.products.clear(),
        db.stockMovements.clear(),
        db.loans.clear(),
        db.employees.clear(),
        db.salaries.clear(),
        db.assets.clear(),
        db.documents.clear(),
        db.conversations.clear(),
        db.messages.clear(),
        db.notifications.clear(),
        db.billingHistory.clear(),
      ]);
      await populateAllSeedData();
    }
  );
}

async function populateAllSeedData(): Promise<void> {
  const parties = buildSeedParties();
  const products = buildSeedProducts();
  const { transactions, lineItems, journalEntries } = buildSeedTransactions(parties, products);

  await db.users.bulkPut(DEMO_USERS);
  await db.businesses.put(DEMO_BUSINESS);
  await db.books.bulkPut(DEMO_BOOKS);
  await db.parties.bulkPut(parties);
  await db.accounts.bulkPut(DEMO_ACCOUNTS);
  await db.products.bulkPut(products);
  await db.transactions.bulkPut(transactions);
  await db.lineItems.bulkPut(lineItems);
  await db.journalEntries.bulkPut(journalEntries);
  await db.stockMovements.bulkPut(DEMO_STOCK_MOVEMENTS);
  await db.loans.bulkPut(DEMO_LOANS);
  await db.employees.bulkPut(DEMO_EMPLOYEES);
  await db.salaries.bulkPut(DEMO_SALARIES);
  await db.assets.bulkPut(DEMO_ASSETS);
  await db.documents.bulkPut(DEMO_DOCUMENTS);
  await db.conversations.bulkPut(DEMO_CONVERSATIONS);
  await db.messages.bulkPut(DEMO_MESSAGES);
  await db.notifications.bulkPut(DEMO_NOTIFICATIONS);
  await db.billingHistory.bulkPut(DEMO_BILLING_HISTORY);
}
