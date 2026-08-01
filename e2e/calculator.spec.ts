import { test, expect } from "@playwright/test";

import { expectToastSuccess, loginAs } from "./helpers/auth";

test.describe("calculator", () => {
  test("create deal scenario with mock fill", async ({ page }) => {
    await loginAs(page);
    await page.goto("/pt-BR/calculator/new");
    await expect(
      page.getByRole("heading", { name: "Novo cenário" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await expect(page.locator('input[value*="Leilão mock"]')).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();
    await page.waitForURL(/\/pt-BR\/calculator\/[0-9a-f-]{36}/i, {
      timeout: 45_000,
    });
    await expectToastSuccess(page);

    await page.goto("/pt-BR/calculator");
    await expect(page.getByText(/Leilão mock/i)).toBeVisible();
  });
});
