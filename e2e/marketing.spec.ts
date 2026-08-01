import { test, expect } from "@playwright/test";

test.describe("marketing", () => {
  test("landing page shows brand and CTAs", async ({ page }) => {
    await page.goto("/pt-BR");
    await expect(page.getByText("House Flipper").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /custo real|flip/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Começar grátis/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Entrar$/i }).first()).toBeVisible();
  });

  test("english locale marketing is reachable", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("House Flipper").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Start free|Sign in/i }).first(),
    ).toBeVisible();
  });
});
