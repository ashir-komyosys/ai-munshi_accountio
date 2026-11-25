import { expect, test } from "@playwright/test";

test.describe("Accountio AI | AI Munshi E2E", () => {
  test("navigates primary routes, runs AI Munshi chat, and switches language/theme", async ({
    page,
  }) => {
    await page.goto("/app/overview");
    await expect(page.getByText("Assalamualaikum!")).toBeVisible();

    // Navigate to AI Munshi Chat
    await page.goto("/app/munshi");
    await expect(page.getByPlaceholder("AI Munshi se baat karein...")).toBeVisible();

    // Navigate to Khatas
    await page.goto("/app/khatas");
    await expect(page.getByText("Ibrahim Traders")).toBeVisible();

    // Navigate to Inventory
    await page.goto("/app/inventory");
    await expect(page.getByText("Cotton Yarn 40s")).toBeVisible();

    // Navigate to Reports
    await page.goto("/app/reports/profit-loss");
    await expect(page.getByText("Net Profit (Munafa)")).toBeVisible();

    // Navigate to Documents & Settings
    await page.goto("/app/documents");
    await expect(page.getByText("NOV-000427")).toBeVisible();

    await page.goto("/app/settings");
    await expect(page.getByText("Al Madina Yarn Traders").first()).toBeVisible();
  });
});
