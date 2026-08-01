import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PROSPECT:
    "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-100",
  UNDER_CONTRACT:
    "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100",
  OWNED_RENOVATING:
    "border-primary/40 bg-primary/15 text-primary dark:text-primary",
  LISTED:
    "border-violet-500/40 bg-violet-500/15 text-violet-950 dark:border-violet-400/40 dark:bg-violet-400/15 dark:text-violet-100",
  SOLD:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-100",
  ARCHIVED: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const t = useTranslations("propertyStatus");
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 font-medium",
        statusStyles[status] ?? statusStyles.ARCHIVED,
        className,
      )}
    >
      {t(status as "PROSPECT")}
    </Badge>
  );
}
