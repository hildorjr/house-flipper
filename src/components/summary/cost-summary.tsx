"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useLocale, useTranslations } from "next-intl";

import { MoneyDisplay } from "@/components/money-display";
import { StatCard } from "@/components/stat-card";
import { summarizeProperty, type PropertySummaryInput } from "@/lib/finance";

type CostSummaryProps = {
  input: PropertySummaryInput;
  currency: string;
};

const CHART_COLORS = [
  "oklch(0.55 0.1 175)",
  "oklch(0.62 0.12 85)",
  "oklch(0.58 0.14 35)",
  "oklch(0.52 0.09 230)",
  "oklch(0.48 0.08 300)",
  "oklch(0.45 0.06 150)",
  "oklch(0.6 0.08 200)",
];

function percent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function CostSummary({ input, currency }: CostSummaryProps) {
  const [salePrice, setSalePrice] = useState(
    input.soldPriceCents ?? input.targetSalePriceCents ?? 0,
  );
  const locale = useLocale();
  const t = useTranslations("summary");
  const tGroups = useTranslations("costGroup");
  const tCategories = useTranslations("categories");
  const summary = useMemo(
    () =>
      summarizeProperty({
        ...input,
        targetSalePriceCents: salePrice || null,
        soldPriceCents: input.soldPriceCents,
      }),
    [input, salePrice],
  );
  const chartData = Object.entries(summary.byGroup)
    .map(([group, total]) => ({
      name: tGroups(group),
      value: total.planned + total.pending + total.paid,
    }))
    .filter((group) => group.value > 0);
  const upperSalePrice = Math.max(
    salePrice * 2,
    input.targetSalePriceCents ?? 0,
    input.purchasePriceCents * 2,
    100_000,
  );
  const projectedRoi =
    summary.netProfitProjected != null && summary.cashInvestedProjected > 0
      ? summary.netProfitProjected / summary.cashInvestedProjected
      : null;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("totalCost")}
          cents={summary.totalCostProjected}
          currency={currency}
          locale={locale}
        />
        <StatCard
          label={t("cashInvested")}
          cents={summary.cashInvestedProjected}
          currency={currency}
          locale={locale}
        />
        <StatCard
          label={t("projectedProfit")}
          cents={summary.netProfitProjected}
          currency={currency}
          locale={locale}
          tone={
            (summary.netProfitProjected ?? 0) >= 0 ? "positive" : "negative"
          }
        />
        <StatCard label={t("roi")} value={percent(projectedRoi)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold tracking-tight">{t("byCategory")}</h2>
          <div className="mt-3 h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    strokeWidth={0}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => (
                      <MoneyDisplay
                        cents={Number(value)}
                        currency={currency}
                        locale={locale}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("emptyChart")}
              </p>
            )}
          </div>
          <div className="mt-2 grid gap-1.5 text-sm">
            {chartData.map((group, index) => (
              <div key={group.name} className="flex justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      background: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  {group.name}
                </span>
                <MoneyDisplay
                  cents={group.value}
                  currency={currency}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold tracking-tight">{t("whatIfSale")}</h2>
          <input
            className="mt-8 w-full accent-primary"
            type="range"
            min="0"
            max={upperSalePrice}
            step="1000"
            value={salePrice}
            onChange={(event) => setSalePrice(Number(event.target.value))}
            disabled={input.soldPriceCents != null}
          />
          <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
            <MoneyDisplay
              cents={summary.salePrice ?? 0}
              currency={currency}
              locale={locale}
            />
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("projectedProfit")}</dt>
              <dd className="font-medium tabular-nums">
                <MoneyDisplay
                  cents={summary.netProfitProjected ?? 0}
                  currency={currency}
                  locale={locale}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {t("brokerCommission")}
              </dt>
              <dd className="font-medium tabular-nums">
                <MoneyDisplay
                  cents={summary.brokerCommissionCents}
                  currency={currency}
                  locale={locale}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("roi")}</dt>
              <dd className="font-medium tabular-nums">{percent(projectedRoi)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("annualizedRoi")}</dt>
              <dd className="font-medium tabular-nums">
                {percent(summary.annualizedRoiActual)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("monthsHeld")}</dt>
              <dd className="font-medium tabular-nums">
                {summary.monthsHeld ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3.5 font-medium">{t("category")}</th>
              <th className="p-3.5 text-right font-medium">{t("planned")}</th>
              <th className="p-3.5 text-right font-medium">{t("actual")}</th>
              <th className="p-3.5 text-right font-medium">{t("variance")}</th>
            </tr>
          </thead>
          <tbody>
            {summary.byCategory.map((category) => (
              <tr key={category.key} className="border-b last:border-0">
                <td className="p-3.5">
                  {tCategories.has(category.key)
                    ? tCategories(category.key)
                    : category.key}
                </td>
                <td className="p-3.5 text-right tabular-nums">
                  <MoneyDisplay
                    cents={category.planned}
                    currency={currency}
                    locale={locale}
                  />
                </td>
                <td className="p-3.5 text-right tabular-nums">
                  <MoneyDisplay
                    cents={category.actual}
                    currency={currency}
                    locale={locale}
                  />
                </td>
                <td className="p-3.5 text-right tabular-nums">
                  <MoneyDisplay
                    cents={category.actual - category.planned}
                    currency={currency}
                    locale={locale}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
