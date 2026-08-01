"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { MoneyDisplay } from "@/components/money-display";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  createRecurringRuleAction,
  deleteRecurringRuleAction,
  generateRecurringExpensesAction,
  updateRecurringRuleAction,
} from "@/server/actions/recurring";

type Category = {
  id: string;
  key: string | null;
  name: string | null;
  group: string;
};

type Rule = {
  id: string;
  categoryId: string;
  description: string;
  estimatedAmountCents: number;
  frequency: "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";
  dayOfMonth: number;
  startDate: Date;
  endDate: Date | null;
  autoGenerate: boolean;
  isActive: boolean;
  category: Category;
};

type RecurringRulesProps = {
  propertyId: string;
  currency: string;
  categories: Category[];
  rules: Rule[];
};

const frequencies = ["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"] as const;

function dateInputValue(date: Date | null = new Date()) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function RecurringRules({
  propertyId,
  currency,
  categories,
  rules,
}: RecurringRulesProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("recurring");
  const th = useTranslations("fieldHelp");
  const tExpenses = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const tCategories = useTranslations("categories");
  const tFrequency = useTranslations("frequency");
  const [editing, setEditing] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("MONTHLY");
  const [dayOfMonth, setDayOfMonth] = useState(10);
  const [startDate, setStartDate] = useState(dateInputValue());
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();

  const categoryName = (category: Category) =>
    category.key ? tCategories(category.key) : (category.name ?? category.group);

  function reset() {
    setEditing(null);
    setShowForm(false);
    setAmountCents(null);
    setCategoryId(categories[0]?.id ?? "");
    setDescription("");
    setFrequency("MONTHLY");
    setDayOfMonth(10);
    setStartDate(dateInputValue());
    setEndDate("");
    setIsActive(true);
  }

  function edit(rule: Rule) {
    setEditing(rule);
    setShowForm(true);
    setAmountCents(rule.estimatedAmountCents);
    setCategoryId(rule.categoryId);
    setDescription(rule.description);
    setFrequency(rule.frequency);
    setDayOfMonth(rule.dayOfMonth);
    setStartDate(dateInputValue(rule.startDate));
    setEndDate(dateInputValue(rule.endDate));
    setIsActive(rule.isActive);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amountCents || !categoryId) return;

    startTransition(async () => {
      const input = {
        categoryId,
        description,
        estimatedAmountCents: amountCents,
        frequency,
        dayOfMonth,
        startDate,
        endDate: endDate || null,
        autoGenerate: true,
        isActive,
      };
      const result = editing
        ? await updateRecurringRuleAction(editing.id, input)
        : await createRecurringRuleAction({ propertyId, ...input });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? tCommon("edit") : t("add"));
      reset();
      router.refresh();
    });
  }

  function remove(ruleId: string) {
    startTransition(async () => {
      const result = await deleteRecurringRuleAction(ruleId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function generate() {
    startTransition(async () => {
      const result = await generateRecurringExpensesAction(propertyId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("generate"));
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex flex-wrap gap-2">
          <FillFormButton
            onFill={() => {
              const mock = mockFixtures.recurring;
              setShowForm(true);
              setEditing(null);
              setAmountCents(mock.amountCents);
              setDescription(mock.description);
              setFrequency(mock.frequency);
              setDayOfMonth(mock.dayOfMonth);
              setStartDate(mock.startDate);
              setEndDate(mock.endDate);
              setIsActive(mock.isActive);
              if (categories[0]) setCategoryId(categories[0].id);
            }}
          />
          <Button size="sm" variant="outline" onClick={generate} disabled={isPending}>
            <RefreshCw />
            {t("generate")}
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} disabled={isPending}>
            <Plus />
            {t("add")}
          </Button>
        </div>
      </div>
      {showForm && (
        <form onSubmit={save} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
          <Field label={t("estimatedAmount")} help={th("recurringAmount")}>
            <MoneyInput value={amountCents} currency={currency} onValueChange={setAmountCents} required />
          </Field>
          <Field label={tExpenses("category")} help={th("expenseCategory")}>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="native-control"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {categoryName(category)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={tExpenses("description")}
            help={th("recurringDescription")}
            className="sm:col-span-2"
          >
            <input
              value={description}
              placeholder={tPlaceholders("expenseDescription")}
              onChange={(event) => setDescription(event.target.value)}
              className="native-control"
              required
            />
          </Field>
          <Field label={t("frequency")} help={th("frequency")}>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as typeof frequency)}
              className="native-control"
            >
              {frequencies.map((value) => (
                <option key={value} value={value}>
                  {tFrequency(value)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("dayOfMonth")} help={th("dayOfMonth")}>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="10"
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value))}
              className="native-control"
              required
            />
          </Field>
          <Field label={t("startDate")} help={th("startDate")}>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="native-control"
              required
            />
          </Field>
          <Field label={t("endDate")} help={th("endDate")}>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="native-control"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            {t("active")}
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={isPending || !amountCents || !categoryId}>
              {tCommon("save")}
            </Button>
            <FillFormButton
              onFill={() => {
                const mock = mockFixtures.recurring;
                setAmountCents(mock.amountCents);
                setDescription(mock.description);
                setFrequency(mock.frequency);
                setDayOfMonth(mock.dayOfMonth);
                setStartDate(mock.startDate);
                setEndDate(mock.endDate);
                setIsActive(mock.isActive);
                if (!categoryId && categories[0]) setCategoryId(categories[0].id);
              }}
            />
            <Button type="button" variant="outline" onClick={reset}>
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      )}
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{rule.description}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryName(rule.category)} · {tFrequency(rule.frequency)} ·{" "}
                  <MoneyDisplay cents={rule.estimatedAmountCents} currency={currency} locale={locale} />
                </p>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => edit(rule)} disabled={isPending}>
                <Pencil />
                <span className="sr-only">{tCommon("edit")}</span>
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => remove(rule.id)}
                disabled={isPending}
              >
                <Trash2 />
                <span className="sr-only">{tCommon("delete")}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
