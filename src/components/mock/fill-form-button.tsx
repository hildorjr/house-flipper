"use client";

import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { showDevFormTools } from "@/lib/mock/form-fixtures";
import { cn } from "@/lib/utils";

type FillFormButtonProps = {
  onFill: () => void;
  className?: string;
};

export function FillFormButton({ onFill, className }: FillFormButtonProps) {
  const t = useTranslations("mock");

  if (!showDevFormTools()) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "border-amber-500/40 bg-amber-500/10 text-amber-950 hover:bg-amber-500/20 dark:text-amber-100",
        className,
      )}
      onClick={onFill}
    >
      <FlaskConical className="size-3.5" />
      {t("fillForm")}
    </Button>
  );
}
