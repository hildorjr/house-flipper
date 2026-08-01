import { Calculator } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { MoneyDisplay } from "@/components/money-display";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";
import { listDealAnalyses } from "@/server/data/deals";

export default async function CalculatorPage() {
  const user = await requireUser();
  const [t, analyses] = await Promise.all([
    getTranslations("calculator"),
    listDealAnalyses(user.id),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <Link
            href="/calculator/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {t("new")}
          </Link>
        }
      />
      {analyses.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={<Calculator className="size-6" />}
          action={
            <Link
              href="/calculator/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              {t("new")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/calculator/${analysis.id}`}
              className="group block rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <h2 className="truncate font-semibold tracking-tight group-hover:text-primary">
                {analysis.name}
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("purchasePrice")}</dt>
                  <dd className="font-medium tabular-nums">
                    <MoneyDisplay
                      cents={analysis.purchasePriceCents}
                      currency={analysis.currency}
                    />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("expectedSale")}</dt>
                  <dd className="font-medium tabular-nums">
                    <MoneyDisplay
                      cents={analysis.expectedSalePriceCents}
                      currency={analysis.currency}
                    />
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
