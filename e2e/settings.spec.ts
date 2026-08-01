import { test, expect } from "@playwright/test";

import { expectToastSuccess, loginAs } from "./helpers/auth";

test.describe("settings", () => {
  test("settings hub links work", async ({ page }) => {
    await loginAs(page);
    await page.goto("/pt-BR/settings");
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();

    await page.getByRole("link", { name: /Perfil/i }).click();
    await expect(page).toHaveURL(/\/pt-BR\/settings\/profile/);

    await page.goto("/pt-BR/settings");
    await page.getByRole("link", { name: /Assinatura/i }).click();
    await expect(page).toHaveURL(/\/pt-BR\/settings\/billing/);
    await expect(page.getByText(/Grátis|Pro/i).first()).toBeVisible();

    await page.goto("/pt-BR/settings");
    await page.getByRole("link", { name: /Preferências/i }).click();
    await expect(page).toHaveURL(/\/pt-BR\/settings\/preferences/);
  });

  test("update profile with mock fill", async ({ page }) => {
    await loginAs(page);
    await page.goto("/pt-BR/settings/profile");
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await expect(page.locator("#fullName")).toHaveValue("Us Mock");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expectToastSuccess(page);
  });
});
