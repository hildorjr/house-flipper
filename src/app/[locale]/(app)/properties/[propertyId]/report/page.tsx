import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ReportPrintButton } from "./report-print-button";
import { requireUser } from "@/server/auth";
import { getProperty } from "@/server/data/properties";
import { getPropertySummaryInput } from "@/server/data/summary";
import { summarizeProperty } from "@/lib/finance";
import { formatMoney } from "@/lib/money";

export default async function PropertyReportPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, input, locale, tExport, tSummary, tCategories] =
    await Promise.all([
      getProperty(user.id, propertyId),
      getPropertySummaryInput(user.id, propertyId),
      getLocale(),
      getTranslations("export"),
      getTranslations("summary"),
      getTranslations("categories"),
    ]);
  if (!property || !input) notFound();

  const summary = summarizeProperty(input);
  const money = (cents: number) => formatMoney(cents, property.currency, locale);
  const percent = (value: number | null) =>
    value == null
      ? "—"
      : new Intl.NumberFormat(locale, { style: "percent" }).format(value);

  return (
    <article className="mx-auto max-w-4xl space-y-8 bg-background p-4 print:max-w-none print:p-0">
      <style>{`@media print { body { background: white } .print\\:hidden { display: none } }`}</style>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tExport("reportTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground">{property.label}</p>
        </div>
        <ReportPrintButton />
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [tSummary("totalCost"), money(summary.totalCostActual)],
          [tSummary("cashInvested"), money(summary.cashInvestedActual)],
          [
            tSummary("projectedProfit"),
            summary.netProfitProjected == null
              ? "—"
              : money(summary.netProfitProjected),
          ],
          [tSummary("roi"), percent(summary.roiOnCashActual)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">
          {tExport("costByCategory")}
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3.5 font-medium">{tSummary("category")}</th>
                <th className="p-3.5 text-right font-medium">
                  {tSummary("actual")}
                </th>
                <th className="p-3.5 text-right font-medium">
                  {tSummary("projected")}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.byCategory.map((category) => (
                <tr key={category.key} className="border-t">
                  <td className="p-3.5">
                    {tCategories.has(category.key)
                      ? tCategories(category.key)
                      : category.key}
                  </td>
                  <td className="p-3.5 text-right tabular-nums">
                    {money(category.actual)}
                  </td>
                  <td className="p-3.5 text-right tabular-nums">
                    {money(category.projected)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
