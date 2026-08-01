import { getTranslations } from "next-intl/server";

import { DealForm } from "@/components/deals/deal-form";
import { requireUser } from "@/server/auth";
import { listRenovationPresets } from "@/server/data/presets";

export default async function NewCalculatorPage() {
  const user = await requireUser();
  const [presets, t] = await Promise.all([
    listRenovationPresets(user.id),
    getTranslations("calculator"),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
      <DealForm
        presets={presets}
        initialValues={{
          name: "",
          city: null,
          state: null,
          country: "BR",
          currency: "BRL",
          propertyType: "APARTMENT",
          acquisitionChannel: "JUDICIAL_AUCTION",
          areaBuiltM2: null,
          purchasePriceCents: 0,
          appraisedValueCents: null,
          auctionCommissionBps: 500,
          itbiRateBps: 300,
          deedAndRegistryCents: 0,
          legalFeesCents: 0,
          arrearsIptuCents: 0,
          arrearsCondoCents: 0,
          evictionCostCents: 0,
          otherAcquisitionCents: 0,
          holdingMonths: 6,
          monthlyHoldingCents: 0,
          financedAmountCents: 0,
          annualRateBps: 0,
          brokerCommissionBps: 600,
          expectedSalePriceCents: 0,
          capitalGainsRateBps: 1500,
          items: presets.map((preset, sortOrder) => ({
            presetKey: preset.key,
            label: preset.key,
            categoryKey: preset.categoryKey,
            quantity: 0,
            unit: preset.unit,
            unitPriceCents: preset.defaultUnitPriceCents,
            sortOrder,
          })),
        }}
      />
    </section>
  );
}
