"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import { createExpenseAction } from "@/server/actions/expenses";

type Category = {
  id: string;
  key: string | null;
  name: string | null;
  group: string;
};

type ExpenseFabProps = {
  propertyId: string;
  currency: string;
  categories: Category[];
  recentCategories: Category[];
};

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function ExpenseFab({
  propertyId,
  currency,
  categories,
  recentCategories,
}: ExpenseFabProps) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const th = useTranslations("fieldHelp");
  const tPlaceholders = useTranslations("placeholders");
  const tCategories = useTranslations("categories");
  const [open, setOpen] = useState(false);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState(recentCategories[0]?.id ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [incurredOn, setIncurredOn] = useState(dateInputValue());
  const [status, setStatus] = useState<"PLANNED" | "PENDING" | "PAID">("PAID");
  const [keepOpen, setKeepOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categoryName = (category: Category) =>
    category.key ? tCategories(category.key) : (category.name ?? category.group);

  function reset() {
    setAmountCents(null);
    setDescription("");
    setIncurredOn(dateInputValue());
    setStatus("PAID");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amountCents || !categoryId) return;

    startTransition(async () => {
      const result = await createExpenseAction({
        propertyId,
        categoryId,
        description,
        amountCents,
        incurredOn,
        status,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("add"));
      reset();
      router.refresh();
      if (!keepOpen) setOpen(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="icon-lg" className="fixed right-5 bottom-5 z-40 rounded-full shadow-lg">
            <Plus />
            <span className="sr-only">{t("fab")}</span>
          </Button>
        }
      />
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("fab")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={save} className="space-y-4 px-4 pb-2">
          <Field label={t("amount")} help={th("expenseAmount")}>
            <MoneyInput
              autoFocus
              value={amountCents}
              currency={currency}
              onValueChange={setAmountCents}
              required
            />
          </Field>
          {recentCategories.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">{t("category")}</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentCategories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    size="sm"
                    variant={category.id === categoryId ? "default" : "outline"}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {categoryName(category)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Field label={t("category")} help={th("expenseCategory")}>
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
          <Field label={t("description")} help={th("expenseDescription")}>
            <input
              value={description}
              placeholder={tPlaceholders("expenseDescription")}
              onChange={(event) => setDescription(event.target.value)}
              className="native-control"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("date")} help={th("expenseDate")}>
              <input
                type="date"
                value={incurredOn}
                onChange={(event) => setIncurredOn(event.target.value)}
                className="native-control"
                required
              />
            </Field>
            <Field label={t("status")} help={th("expenseStatus")}>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="native-control"
              >
                <option value="PAID">{t("paid")}</option>
                <option value="PENDING">{t("pending")}</option>
                <option value="PLANNED">{t("planned")}</option>
              </select>
            </Field>
          </div>
          <SheetFooter className="px-0">
            <Button
              type="submit"
              disabled={isPending || !amountCents || !categoryId}
              onClick={() => setKeepOpen(false)}
            >
              {t("add")}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending || !amountCents || !categoryId}
              onClick={() => setKeepOpen(true)}
            >
              {t("saveAndAdd")}
            </Button>
            <FillFormButton
              onFill={() => {
                const mock = mockFixtures.expense;
                setAmountCents(mock.amountCents);
                setDescription(mock.description);
                setIncurredOn(mock.incurredOn);
                setStatus(mock.status);
                if (!categoryId && categories[0]) setCategoryId(categories[0].id);
              }}
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
