import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center page-enter",
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {icon}
        </div>
      )}
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
