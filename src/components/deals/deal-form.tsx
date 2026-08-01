"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { FormSection, FormSectionGroup } from "@/components/form-section";
import { Field } from "@/components/field";
import { MoneyDisplay } from "@/components/money-display";
import { MoneyInput } from "@/components/money-input";
import { FillFormButton } from "@/components/mock/fill-form-button";
import { PercentInput } from "@/components/percent-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeDeal, maxBidForTargetRoi } from "@/lib/finance";
import { mockFixtures } from "@/lib/mock/form-fixtures";
import {
  convertDealToPropertyAction,
  createDealAnalysisAction,
  updateDealAnalysisAction,
} from "@/server/actions/deals";
import { type DealInput } from "@/lib/validators/deal";
import { useRouter } from "@/i18n/navigation";

type Preset = {
  key: string;
  categoryKey: string;
  unit: string;
  defaultUnitPriceCents: number;
};

type DealItem = DealInput["items"][number];

type DealFormProps = {
  analysisId?: string;
  initialValues: DealInput;
  presets: Preset[];
  convertedPropertyId?: string | null;
};

function number(value: string) {
  return value === "" ? 0 : Number(value);
}

function percent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function buildItems(presets: Preset[], saved: DealItem[]) {
  return presets.map((preset, sortOrder) => {
    const existing = saved.find((item) => item.presetKey === preset.key);
    return (
      existing ?? {
        presetKey: preset.key,
        label: preset.key,
        categoryKey: preset.categoryKey,
        quantity: 0,
        unit: preset.unit,
        unitPriceCents: preset.defaultUnitPriceCents,
        sortOrder,
      }
    );
  });
}

export function DealForm({
  analysisId,
  initialValues,
  presets,
  convertedPropertyId,
}: DealFormProps) {
  const [values, setValues] = useState(() => ({
    ...initialValues,
    items: buildItems(presets, initialValues.items),
  }));
  const [activeKeys, setActiveKeys] = useState(() =>
    new Set(
      buildItems(presets, initialValues.items)
        .filter((item) => item.quantity > 0)
        .map((item) => item.presetKey)
        .filter(Boolean) as string[],
    ),
  );
  const [presetToAdd, setPresetToAdd] = useState("");
  const [targetRoi, setTargetRoi] = useState(0.2);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("calculator");
  const th = useTranslations("fieldHelp");
  const tCommon = useTranslations("common");
  const tPlaceholders = useTranslations("placeholders");
  const tProperties = useTranslations("properties");
  const tPresets = useTranslations("presets");

  const result = useMemo(
    () =>
      analyzeDeal({
        purchasePriceCents: values.purchasePriceCents,
        auctionCommissionBps: values.auctionCommissionBps,
        itbiRateBps: values.itbiRateBps,
        deedAndRegistryCents: values.deedAndRegistryCents,
        legalFeesCents: values.legalFeesCents,
        arrearsIptuCents: values.arrearsIptuCents,
        arrearsCondoCents: values.arrearsCondoCents,
        evictionCostCents: values.evictionCostCents,
        otherAcquisitionCents: values.otherAcquisitionCents,
        holdingMonths: values.holdingMonths,
        monthlyHoldingCents: values.monthlyHoldingCents,
        financedAmountCents: values.financedAmountCents,
        annualRateBps: values.annualRateBps,
        brokerCommissionBps: values.brokerCommissionBps,
        expectedSalePriceCents: values.expectedSalePriceCents,
        capitalGainsRateBps: values.capitalGainsRateBps,
        renovationItems: values.items,
      }),
    [values],
  );
  const maxBid = useMemo(
    () =>
      maxBidForTargetRoi({
        ...values,
        targetRoi,
        renovationItems: values.items,
      }),
    [targetRoi, values],
  );

  const availablePresets = presets.filter(
    (preset) => !activeKeys.has(preset.key),
  );
  const visibleItems = values.items.filter(
    (item) => item.presetKey && activeKeys.has(item.presetKey),
  );

  function update<K extends keyof DealInput>(key: K, value: DealInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(presetKey: string, quantity: number) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.presetKey === presetKey ? { ...item, quantity } : item,
      ),
    }));
  }

  function addPreset() {
    if (!presetToAdd) return;
    setActiveKeys((current) => new Set(current).add(presetToAdd));
    setPresetToAdd("");
  }

  function removePreset(presetKey: string) {
    setActiveKeys((current) => {
      const next = new Set(current);
      next.delete(presetKey);
      return next;
    });
    updateItem(presetKey, 0);
  }

  function save() {
    startTransition(async () => {
      if (analysisId) {
        const response = await updateDealAnalysisAction(analysisId, values);
        if (!response.ok) {
          toast.error(response.error);
          return;
        }
        toast.success(tCommon("success"));
        return;
      }
      const response = await createDealAnalysisAction(values);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      toast.success(tCommon("success"));
      router.replace(`/calculator/${response.data.id}`);
    });
  }

  function convert() {
    if (!analysisId) return;
    startTransition(async () => {
      const response = await convertDealToPropertyAction(analysisId);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      router.replace(`/properties/${response.data.id}`);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <FormSectionGroup>
        <FormSection
          title={t("scenarioBasics")}
          description={t("scenarioBasicsHint")}
          defaultOpen
          columns={1}
        >
          <Field label={t("name")} help={th("scenarioName")}>
            <Input
              value={values.name}
              placeholder={tPlaceholders("scenarioName")}
              onChange={(event) => update("name", event.target.value)}
            />
          </Field>
          <Field label={tProperties("city")} help={th("city")}>
            <Input
              value={values.city ?? ""}
              placeholder={tPlaceholders("city")}
              onChange={(event) => update("city", event.target.value || null)}
            />
          </Field>
        </FormSection>

        <FormSection
          title={t("acquisition")}
          description={t("acquisitionHint")}
          defaultOpen
        >
          <Field label={t("purchasePrice")} help={th("purchasePrice")}>
            <MoneyInput
              value={values.purchasePriceCents}
              onValueChange={(value) =>
                update("purchasePriceCents", value ?? 0)
              }
            />
          </Field>
          <Field label={t("expectedSale")} help={th("expectedSale")}>
            <MoneyInput
              value={values.expectedSalePriceCents}
              onValueChange={(value) =>
                update("expectedSalePriceCents", value ?? 0)
              }
            />
          </Field>
          <Field
            label={tProperties("auctionCommission")}
            help={th("auctionCommission")}
          >
            <PercentInput
              nullable={false}
              placeholder={tPlaceholders("auctionPercent")}
              valueBps={values.auctionCommissionBps}
              onValueChange={(value) =>
                update("auctionCommissionBps", value ?? 0)
              }
            />
          </Field>
          <Field label={tProperties("itbiRate")} help={th("itbiRate")}>
            <PercentInput
              nullable={false}
              placeholder={tPlaceholders("percent")}
              valueBps={values.itbiRateBps}
              onValueChange={(value) => update("itbiRateBps", value ?? 0)}
            />
          </Field>
          <Field label={t("deedAndRegistry")} help={th("deedAndRegistry")}>
            <MoneyInput
              value={values.deedAndRegistryCents}
              onValueChange={(value) =>
                update("deedAndRegistryCents", value ?? 0)
              }
            />
          </Field>
          <Field label={t("legalFees")} help={th("legalFees")}>
            <MoneyInput
              value={values.legalFeesCents}
              onValueChange={(value) => update("legalFeesCents", value ?? 0)}
            />
          </Field>
          <Field label={t("otherAcquisition")} help={th("otherAcquisition")}>
            <MoneyInput
              value={values.otherAcquisitionCents}
              onValueChange={(value) =>
                update("otherAcquisitionCents", value ?? 0)
              }
            />
          </Field>
        </FormSection>

        <FormSection
          title={t("holding")}
          description={t("holdingHint")}
          defaultOpen={
            values.holdingMonths > 0 ||
            values.monthlyHoldingCents > 0 ||
            values.financedAmountCents > 0
          }
        >
          <Field label={t("holdingMonths")} help={th("holdingMonths")}>
            <Input
              type="number"
              min="0"
              placeholder={tPlaceholders("holdingMonths")}
              value={values.holdingMonths}
              onChange={(event) =>
                update("holdingMonths", number(event.target.value))
              }
            />
          </Field>
          <Field label={t("monthlyHolding")} help={th("monthlyHolding")}>
            <MoneyInput
              value={values.monthlyHoldingCents}
              onValueChange={(value) =>
                update("monthlyHoldingCents", value ?? 0)
              }
            />
          </Field>
          <Field label={t("financed")} help={th("financed")}>
            <MoneyInput
              value={values.financedAmountCents}
              onValueChange={(value) =>
                update("financedAmountCents", value ?? 0)
              }
            />
          </Field>
          <Field label={t("annualRateBps")} help={th("annualRateBps")}>
            <PercentInput
              nullable={false}
              placeholder={tPlaceholders("loanPercent")}
              valueBps={values.annualRateBps}
              onValueChange={(value) => update("annualRateBps", value ?? 0)}
            />
          </Field>
        </FormSection>

        <FormSection
          title={t("saleAssumptions")}
          description={t("saleAssumptionsHint")}
          defaultOpen={false}
        >
          <Field
            label={t("brokerCommissionBps")}
            help={th("brokerCommission")}
          >
            <PercentInput
              nullable={false}
              placeholder={tPlaceholders("brokerPercent")}
              valueBps={values.brokerCommissionBps}
              onValueChange={(value) =>
                update("brokerCommissionBps", value ?? 0)
              }
            />
          </Field>
          <Field label={t("capitalGainsBps")} help={th("capitalGains")}>
            <PercentInput
              nullable={false}
              placeholder={tPlaceholders("capitalGainsPercent")}
              valueBps={values.capitalGainsRateBps}
              onValueChange={(value) =>
                update("capitalGainsRateBps", value ?? 0)
              }
            />
          </Field>
        </FormSection>

        <FormSection
          title={t("renovation")}
          description={t("renovationHint")}
          defaultOpen={activeKeys.size > 0}
          columns={1}
        >
          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              {t("noRenovationItems")}
            </p>
          ) : (
            visibleItems.map((item) => (
              <div
                key={item.presetKey}
                className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3 sm:flex-row sm:items-end"
              >
                <Field
                  label={`${item.presetKey ? tPresets(item.presetKey) : item.label} (${item.unit})`}
                  className="min-w-0 flex-1 space-y-2"
                  help={th("renovationQty")}
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={tPlaceholders("quantity")}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.presetKey!, number(event.target.value))
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 self-end"
                  onClick={() => removePreset(item.presetKey!)}
                  aria-label={t("removeItem")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}

          {availablePresets.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field label={t("presets")} className="min-w-0 flex-1 space-y-2">
                <select
                  value={presetToAdd}
                  onChange={(event) => setPresetToAdd(event.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm dark:bg-muted/60"
                >
                  <option value="">{tCommon("none")}</option>
                  {availablePresets.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {tPresets(preset.key)}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!presetToAdd}
                onClick={addPreset}
              >
                <Plus className="size-4" />
                {t("addPreset")}
              </Button>
            </div>
          )}
        </FormSection>

        <div className="sticky bottom-20 z-10 flex animate-in fade-in slide-in-from-bottom-2 flex-wrap gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur duration-300 md:bottom-4">
          <Button
            type="button"
            className="min-h-11 rounded-xl"
            disabled={isPending}
            onClick={save}
          >
            {tCommon("save")}
          </Button>
          {analysisId && !convertedPropertyId && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              disabled={isPending}
              onClick={convert}
            >
              {t("convert")}
            </Button>
          )}
          <FillFormButton
            className="min-h-11"
            onFill={() => {
              const keys = mockFixtures.dealRenovationKeys.filter((key) =>
                presets.some((preset) => preset.key === key),
              );
              setActiveKeys(new Set(keys));
              setValues((current) => ({
                ...current,
                ...mockFixtures.deal,
                items: current.items.map((item) => {
                  const quantity =
                    item.presetKey &&
                    mockFixtures.dealRenovationQty[item.presetKey];
                  return quantity
                    ? { ...item, quantity }
                    : { ...item, quantity: 0 };
                }),
              }));
            }}
          />
        </div>
      </FormSectionGroup>

      <aside className="stagger-in space-y-3 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-300">
          <h2 className="font-semibold tracking-tight">{t("results")}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("totalCost")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                <MoneyDisplay
                  cents={result.totalCostCents}
                  currency={values.currency}
                  locale={locale}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("renovation")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                <MoneyDisplay
                  cents={result.renovationTotalCents}
                  currency={values.currency}
                  locale={locale}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("netProfit")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                <MoneyDisplay
                  cents={result.netProfitCents}
                  currency={values.currency}
                  locale={locale}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("roiOnCash")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {percent(result.roiOnCash)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("roiOnTotal")}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {percent(result.roiOnTotal)}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5 shadow-sm">
          <h2 className="font-semibold tracking-tight text-foreground">
            {t("maxBid")}
          </h2>
          <Field
            label={t("targetRoi")}
            help={th("targetRoi")}
            className="mt-3 space-y-2"
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={tPlaceholders("targetRoi")}
              value={targetRoi}
              onChange={(event) =>
                setTargetRoi(Number(event.target.value) || 0)
              }
            />
          </Field>
          <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            <MoneyDisplay
              cents={maxBid}
              currency={values.currency}
              locale={locale}
            />
          </p>
        </section>
      </aside>
    </div>
  );
}
