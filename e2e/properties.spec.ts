import { test, expect } from "@playwright/test";

import {
  createPropertyViaUi,
  dismissToasts,
  expectToastSuccess,
  fillNamedInput,
  loginAs,
} from "./helpers/auth";

test.describe("properties", () => {
  test("empty state then create property with mock fill", async ({ page }) => {
    await loginAs(page);
    await expect(page.getByRole("heading", { name: "Imóveis" })).toBeVisible();
    await expect(page.getByText("Nenhum imóvel ainda")).toBeVisible();

    const propertyId = await createPropertyViaUi(page);
    await expect(page.getByRole("heading", { name: /Apto mock/i })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pt-BR/properties/${propertyId}`));

    await page.goto("/pt-BR/properties");
    await expect(page.getByRole("link", { name: /Apto mock/i })).toBeVisible();
  });

  test("edit property details", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);

    await page.goto(`/pt-BR/properties/${propertyId}`);
    await fillNamedInput(page, "label", "Imovel e2e editado");
    await dismissToasts(page);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expectToastSuccess(page);

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Imovel e2e editado" }),
    ).toBeVisible();
  });

  test("property tabs are reachable", async ({ page }) => {
    await loginAs(page);
    const propertyId = await createPropertyViaUi(page);
    const tabs = [
      ["", "Visão geral"],
      ["/costs", "Custos"],
      ["/tasks", "Tarefas"],
      ["/financing", "Financiamento"],
      ["/documents", "Documentos"],
      ["/sale", "Venda"],
    ] as const;

    for (const [suffix, label] of tabs) {
      await page.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(
        new RegExp(`/pt-BR/properties/${propertyId}${suffix}$`),
      );
    }
  });
});
