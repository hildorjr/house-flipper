"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { percentToBps } from "@/lib/rates";

type PercentInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  valueBps: number | null;
  onValueChange: (bps: number | null) => void;
  nullable?: boolean;
};

export function PercentInput({
  valueBps,
  onValueChange,
  nullable = true,
  ...props
}: PercentInputProps) {
  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      step="0.01"
      min={0}
      value={valueBps == null ? "" : valueBps / 100}
      onChange={(event) => {
        if (event.target.value === "") {
          onValueChange(nullable ? null : 0);
          return;
        }
        onValueChange(percentToBps(Number(event.target.value)));
      }}
    />
  );
}
