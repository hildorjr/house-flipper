import { formatMoney } from "@/lib/money";

type MoneyDisplayProps = {
  cents: number;
  currency?: string;
  locale?: string;
};

export function MoneyDisplay({
  cents,
  currency = "BRL",
  locale = "pt-BR",
}: MoneyDisplayProps) {
  return <>{formatMoney(cents, currency, locale)}</>;
}
