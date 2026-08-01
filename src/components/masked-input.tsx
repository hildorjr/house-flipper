"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { applyMask, type InputMask } from "@/lib/masks";

type MaskedInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  mask: InputMask;
  value: string;
  onValueChange: (value: string) => void;
};

export function MaskedInput({
  mask,
  value,
  onValueChange,
  ...props
}: MaskedInputProps) {
  return (
    <Input
      {...props}
      value={applyMask(mask, value)}
      onChange={(event) => onValueChange(applyMask(mask, event.target.value))}
    />
  );
}
