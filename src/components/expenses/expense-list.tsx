"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DateDisplay } from "@/components/date-display";
import { MoneyDisplay } from "@/components/money-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  confirmPendingExpenseAction,
  deleteExpenseAction,
} from "@/server/actions/expenses";

type Expense = {
  id: string;
  description: string;
  amountCents: number;
  incurredOn: Date;
  status: "PLANNED" | "PENDING" | "PAID";
  category: {
    group: string;
    key: string | null;
    name: string | null;
  };
};

type ExpenseListProps = {
  expenses: Expense[];
  currency: string;
};

const groups = [
  "ACQUISITION",
  "TAXES_AND_FEES",
  "RENOVATION",
  "HOLDING",
  "FINANCING",
  "SELLING",
  "OTHER",
] as const;

export function ExpenseList({ expenses, currency }: ExpenseListProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tCostGroup = useTranslations("costGroup");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          (!group || expense.category.group === group) &&
          (!status || expense.status === status),
      ),
    [expenses, group, status],
  );

  function categoryName(expense: Expense) {
    return expense.category.key
      ? tCategories(expense.category.key)
      : (expense.category.name ?? tCostGroup(expense.category.group));
  }

  function confirm(expenseId: string) {
    startTransition(async () => {
      const result = await confirmPendingExpenseAction(expenseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(expenseId: string) {
    startTransition(async () => {
      const result = await deleteExpenseAction(expenseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        <select
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          className="native-control"
          aria-label={tCommon("filter")}
        >
          <option value="">{tCommon("all")}</option>
          {groups.map((value) => (
            <option key={value} value={value}>
              {tCostGroup(value)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="native-control"
          aria-label={t("status")}
        >
          <option value="">{tCommon("all")}</option>
          <option value="PAID">{t("paid")}</option>
          <option value="PENDING">{t("pending")}</option>
          <option value="PLANNED">{t("planned")}</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="divide-y rounded-2xl border bg-card shadow-sm">
          {filtered.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium">{expense.description}</p>
                  <p className="shrink-0 font-semibold">
                    <MoneyDisplay cents={expense.amountCents} currency={currency} locale={locale} />
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryName(expense)} · <DateDisplay value={expense.incurredOn} locale={locale} />
                </p>
              </div>
              {expense.status === "PENDING" && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => confirm(expense.id)}
                >
                  <Check />
                  <span className="sr-only">{t("confirmAmount")}</span>
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button size="icon-sm" variant="ghost" disabled={isPending}>
                      <Trash2 />
                      <span className="sr-only">{tCommon("delete")}</span>
                    </Button>
                  }
                />
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tCommon("delete")}</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => remove(expense.id)}
                    >
                      {tCommon("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
