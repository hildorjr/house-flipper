import { expect, type Page } from "@playwright/test";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function loginAs(page: Page, email = uniqueEmail()) {
  await page.goto("/pt-BR/login");
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await page.waitForURL(/\/pt-BR\/verify/);
  await page.locator("#code").fill("000000");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL(/\/pt-BR\/properties/);
  return email;
}

export async function createPropertyViaUi(page: Page) {
  await page.goto("/pt-BR/properties/new");
  await page.getByRole("button", { name: "Preencher formulário" }).click();
  await expect(page.locator('input[name="label"]')).toHaveValue(/mock/i, {
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "Criar" }).click();

  const detailUrl = /\/pt-BR\/properties\/[0-9a-f-]{36}/i;
  try {
    await page.waitForURL(detailUrl, { timeout: 45_000 });
  } catch {
    const errorToast = page
      .getByText(/PROPERTY_LIMIT|Something went wrong|Erro|failed|inválid/i)
      .first();
    if (await errorToast.isVisible().catch(() => false)) {
      throw new Error(`Property create failed: ${await errorToast.textContent()}`);
    }

    await page.goto("/pt-BR/properties");
    const link = page.getByRole("link", { name: /Apto mock/i }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await page.waitForURL(detailUrl, { timeout: 30_000 });
  }

  const match = page.url().match(/properties\/([0-9a-f-]{36})/i);
  if (!match) throw new Error(`Property id missing from URL: ${page.url()}`);
  return match[1];
}

export async function fillNamedInput(page: Page, name: string, value: string) {
  const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`);
  await expect(input).toBeVisible();
  await input.click();
  await input.fill("");
  await input.pressSequentially(value, { delay: 15 });
  await expect(input).toHaveValue(value);
}

export async function dismissToasts(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-sonner-toast]").forEach((el) => el.remove());
  });
}

export async function expectToastSuccess(page: Page) {
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Salvo com sucesso" }),
  ).toBeVisible({
    timeout: 15_000,
  });
}
