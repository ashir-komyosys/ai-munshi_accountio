import {
  mockAuthService,
  mockBooksService,
  mockCashBankService,
  mockChatService,
  mockDocumentsService,
  mockInventoryService,
  mockKhatasService,
  mockLoansService,
  mockNotificationsService,
  mockReportsService,
  mockSettingsService,
  mockSubscriptionService,
  mockTransactionsService,
} from "./mock/mockServices";

/**
 * Service Registry
 * Current stage: All services are backed by local IndexedDB (Dexie) mock adapters.
 * Future stage: Swap individual adapters here with live HTTP/REST adapters
 * without modifying any UI component.
 */
export const services = {
  auth: mockAuthService,
  books: mockBooksService,
  khatas: mockKhatasService,
  transactions: mockTransactionsService,
  inventory: mockInventoryService,
  cashBank: mockCashBankService,
  loans: mockLoansService,
  reports: mockReportsService,
  documents: mockDocumentsService,
  chat: mockChatService,
  notifications: mockNotificationsService,
  settings: mockSettingsService,
  subscription: mockSubscriptionService,
};
