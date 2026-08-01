import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ExpenseFab } from "@/components/expenses/expense-fab";
import { ExpenseList } from "@/components/expenses/expense-list";
import { RecurringRules } from "@/components/recurring/recurring-rules";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/server/auth";
import { listCategories } from "@/server/data/categories";
import { listExpenses, listRecentCategories } from "@/server/data/expenses";
import { getProperty } from "@/server/data/properties";
import { listRules } from "@/server/data/recurring";

type CostsPageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function CostsPage({ params }: CostsPageProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const property = await getProperty(user.id, propertyId);
  if (!property) notFound();

  const [expenses, recent, categories, rules, tExpenses, tSummary] =
    await Promise.all([
      listExpenses(user.id, { propertyId }),
      listRecentCategories(user.id, propertyId),
      listCategories(user.id),
      listRules(user.id, propertyId),
      getTranslations("expenses"),
      getTranslations("summary"),
    ]);
  const recentCategories = recent.map(({ category }) => category);

  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const actual = expenses
    .filter((expense) => expense.status === "PAID")
    .reduce((sum, expense) => sum + expense.amountCents, 0);
  const planned = expenses
    .filter((expense) => expense.status !== "PAID")
    .reduce((sum, expense) => sum + expense.amountCents, 0);

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{tExpenses("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tExpenses("emptyDescription")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={tSummary("totalCost")}
          cents={total}
          currency={property.currency}
        />
        <StatCard
          label={tSummary("actual")}
          cents={actual}
          currency={property.currency}
        />
        <StatCard
          label={tSummary("planned")}
          cents={planned}
          currency={property.currency}
        />
      </div>
      <ExpenseList expenses={expenses} currency={property.currency} />
      <RecurringRules
        propertyId={propertyId}
        currency={property.currency}
        categories={categories}
        rules={rules}
      />
      <ExpenseFab
        propertyId={propertyId}
        currency={property.currency}
        categories={categories}
        recentCategories={recentCategories}
      />
    </div>
  );
}
