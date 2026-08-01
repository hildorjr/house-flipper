export const MAX_MONEY_CENTS = 2_100_000_000;

export function formatMoney(
  cents: number,
  currency = "BRL",
  locale = "pt-BR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function parseMoneyInput(text: string, locale = "pt-BR"): number | null {
  const cleaned = text.trim();
  if (!cleaned) return null;

  const isPtBr = locale.startsWith("pt");
  let normalized = cleaned.replace(/[^\d.,\-]/g, "");

  if (isPtBr) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  }

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;

  const cents = Math.round(value * 100);
  if (Math.abs(cents) > MAX_MONEY_CENTS) return null;
  return cents;
}

export function centsFromBps(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10_000);
}
