import { MoneyDisplay } from "@/components/money-display";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  cents?: number | null;
  value?: string;
  currency?: string;
  locale?: string;
  tone?: "default" | "positive" | "negative";
  className?: string;
};

export function StatCard({
  label,
  cents,
  value,
  currency = "BRL",
  locale = "pt-BR",
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold tracking-tight tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value != null ? (
          value
        ) : cents == null ? (
          "—"
        ) : (
          <MoneyDisplay cents={cents} currency={currency} locale={locale} />
        )}
      </p>
    </div>
  );
}
