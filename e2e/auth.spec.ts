import { test, expect } from "@playwright/test";

import { loginAs, uniqueEmail } from "./helpers/auth";

test.describe("auth", () => {
  test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/pt-BR/properties");
    await page.waitForURL(/\/pt-BR\/login/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("mock email OTP signs in and reaches properties", async ({ page }) => {
    const email = await loginAs(page);
    await expect(page.getByRole("heading", { name: "Imóveis" })).toBeVisible();
    await expect(page.getByText(email)).toHaveCount(0);
  });

  test("invalid OTP stays on verify", async ({ page }) => {
    await page.goto("/pt-BR/login");
    await page.locator("#email").fill(uniqueEmail("bad-otp"));
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForURL(/\/pt-BR\/verify/);
    await page.locator("#code").fill("111111");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText(/Código inválido|Use mock code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/pt-BR\/verify/);
  });
});
