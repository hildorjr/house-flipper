"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { FormSection } from "@/components/form-section";
import { Field } from "@/components/field";
import { MoneyDisplay } from "@/components/money-display";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { PercentInput } from "@/components/percent-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  markPropertySoldAction,
  updateSaleAction,
} from "@/server/actions/sale";
import { type SaleInput } from "@/lib/validators/sale";
import { useRouter } from "@/i18n/navigation";

type SaleFormProps = {
  propertyId: string;
  currency: string;
  initialValues: SaleInput;
  readOnly: boolean;
  capitalGainsCents: number;
  netProfitCents: number | null;
  roi: number | null;
};

function percent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function SaleForm({
  propertyId,
  currency,
  initialValues,
  readOnly,
  capitalGainsCents,
  netProfitCents,
  roi,
}: SaleFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("sale");
  const th = useTranslations("fieldHelp");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");

  function save(markSold: boolean) {
    startTransition(async () => {
      const result = markSold
        ? await markPropertySoldAction(propertyId, values)
        : await updateSaleAction(propertyId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(tCommon("success"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <FormSection title={t("title")} description={t("empty")} defaultOpen>
        <Field label={t("listingPrice")} help={th("listingPrice")}>
          <MoneyInput
            disabled={readOnly}
            value={values.targetSalePriceCents}
            currency={currency}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                targetSalePriceCents: value,
              }))
            }
          />
        </Field>
        <Field label={t("soldPrice")} help={th("soldPrice")}>
          <MoneyInput
            disabled={readOnly}
            value={values.soldPriceCents}
            currency={currency}
            onValueChange={(value) =>
              setValues((current) => ({ ...current, soldPriceCents: value }))
            }
          />
        </Field>
        <Field label={t("soldDate")} help={th("soldDate")}>
          <Input
            disabled={readOnly}
            type="date"
            value={values.soldDate ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                soldDate: event.target.value || null,
              }))
            }
          />
        </Field>
        <Field label={t("brokerCommission")} help={th("brokerCommission")}>
          <PercentInput
            disabled={readOnly}
            nullable={false}
            placeholder={tPlaceholders("brokerPercent")}
            valueBps={values.brokerCommissionBps}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                brokerCommissionBps: value ?? 0,
              }))
            }
          />
        </Field>
        <Field
          label={t("capitalGainsRate")}
          help={th("capitalGains")}
          className="sm:col-span-2"
        >
          <PercentInput
            disabled={readOnly}
            nullable={false}
            placeholder={tPlaceholders("capitalGainsPercent")}
            valueBps={values.capitalGainsRateBps}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                capitalGainsRateBps: value ?? 0,
              }))
            }
          />
        </Field>
      </FormSection>

      <p className="rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100">
        {t("capitalGainsDisclaimer")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("capitalGains")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            <MoneyDisplay
              cents={capitalGainsCents}
              currency={currency}
              locale={locale}
            />
          </p>
        </div>
        {initialValues.soldPriceCents != null && (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("profit")}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                <MoneyDisplay
                  cents={netProfitCents ?? 0}
                  currency={currency}
                  locale={locale}
                />
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("roi")}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {percent(roi)}
              </p>
            </div>
          </>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={() => save(false)}
          >
            {tCommon("save")}
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={isPending || values.soldPriceCents == null}
            onClick={() => save(true)}
          >
            {t("markSold")}
          </Button>
          <FillFormButton
            onFill={() => setValues((current) => ({ ...current, ...mockFixtures.sale }))}
          />
        </div>
      )}
    </div>
  );
}
