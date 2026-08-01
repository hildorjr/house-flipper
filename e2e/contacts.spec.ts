import { test, expect } from "@playwright/test";

import { loginAs } from "./helpers/auth";

test.describe("contacts", () => {
  test("create contact with mock fill", async ({ page }) => {
    await loginAs(page);
    await page.goto("/pt-BR/contacts");
    await expect(page.getByRole("heading", { name: "Contatos" })).toBeVisible();

    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.locator("form").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("João Eletricista Mock")).toBeVisible({
      timeout: 15_000,
    });
  });
});
