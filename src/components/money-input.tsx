"use client";

import { useState, type ComponentProps } from "react";
import { useLocale } from "next-intl";

import { Input } from "@/components/ui/input";
import { formatMoney, parseMoneyInput } from "@/lib/money";

type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value: number | null;
  currency?: string;
  onValueChange: (value: number | null) => void;
};

export function MoneyInput({
  value,
  currency = "BRL",
  onValueChange,
  onBlur,
  placeholder,
  ...props
}: MoneyInputProps) {
  const locale = useLocale();
  const format = (cents: number | null) =>
    cents === null ? "" : formatMoney(cents, currency, locale);

  const formattedValue = format(value);
  const [text, setText] = useState(formattedValue);
  const [syncedValue, setSyncedValue] = useState(formattedValue);

  if (formattedValue !== syncedValue) {
    setSyncedValue(formattedValue);
    setText(formattedValue);
  }

  return (
    <Input
      {...props}
      inputMode="decimal"
      placeholder={placeholder ?? format(35_000_000)}
      value={text}
      onChange={(event) => {
        const nextText = event.target.value;
        const cents = parseMoneyInput(nextText, locale);
        setText(nextText);
        setSyncedValue(format(cents));
        onValueChange(cents);
      }}
      onBlur={(event) => {
        setText(format(parseMoneyInput(text, locale)));
        onBlur?.(event);
      }}
    />
  );
}
