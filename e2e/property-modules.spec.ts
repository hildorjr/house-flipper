import { test, expect } from "@playwright/test";

import {
  createPropertyViaUi,
  expectToastSuccess,
  loginAs,
} from "./helpers/auth";

test.describe("property modules", () => {
  test("add expense on costs page", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/costs`);
    await page.getByRole("button", { name: "Nova despesa" }).click();
    await expect(page.getByRole("heading", { name: "Nova despesa" })).toBeVisible();
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.getByRole("button", { name: "Adicionar despesa" }).click();
    await expect(page.getByText("Material elétrico — mock")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("add recurring cost rule", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/costs`);
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.locator("form").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Condomínio — mock").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("add task", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/tasks`);
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.locator("form").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Trocar fiação — mock")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("add financing loan", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/financing`);
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.locator("form input[type='number']").nth(1).fill("12");
    await page.locator("form").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Banco Mock")).toBeVisible({ timeout: 45_000 });
  });

  test("update sale assumptions", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/sale`);
    await page.getByRole("button", { name: "Preencher formulário" }).click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expectToastSuccess(page);
    await expect(page.getByText("Estimativa de ganho de capital")).toBeVisible();
  });

  test("documents empty state", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}/documents`);
    await expect(page.getByText("Nenhum documento ainda")).toBeVisible();
  });
});
