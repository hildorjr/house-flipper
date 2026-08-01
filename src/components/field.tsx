"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, help, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel label={label} help={help} />
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FieldLabel({
  label,
  help,
  className,
}: {
  label: string;
  help?: string;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <div className={cn("flex min-h-5 items-center gap-1.5", className)}>
      <Label className="leading-none">{label}</Label>
      {help ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            delay={200}
            closeOnClick={false}
            aria-label={t("fieldHelp")}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CircleHelp className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>{help}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
