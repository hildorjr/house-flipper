import { notFound } from "next/navigation";

import { DealForm } from "@/components/deals/deal-form";
import { requireUser } from "@/server/auth";
import { getDealAnalysis } from "@/server/data/deals";
import { listRenovationPresets } from "@/server/data/presets";

type DealAnalysisPageProps = {
  params: Promise<{ analysisId: string }>;
};

export default async function DealAnalysisPage({ params }: DealAnalysisPageProps) {
  const { analysisId } = await params;
  const user = await requireUser();
  const [analysis, presets] = await Promise.all([
    getDealAnalysis(user.id, analysisId),
    listRenovationPresets(user.id),
  ]);
  if (!analysis) notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{analysis.name}</h1>
      <DealForm
        analysisId={analysis.id}
        convertedPropertyId={analysis.convertedPropertyId}
        presets={presets}
        initialValues={{
          name: analysis.name,
          city: analysis.city,
          state: analysis.state,
          country: analysis.country,
          currency: analysis.currency,
          propertyType: analysis.propertyType,
          acquisitionChannel: analysis.acquisitionChannel,
          areaBuiltM2: analysis.areaBuiltM2?.toNumber() ?? null,
          purchasePriceCents: analysis.purchasePriceCents,
          appraisedValueCents: analysis.appraisedValueCents,
          auctionCommissionBps: analysis.auctionCommissionBps,
          itbiRateBps: analysis.itbiRateBps,
          deedAndRegistryCents: analysis.deedAndRegistryCents,
          legalFeesCents: analysis.legalFeesCents,
          arrearsIptuCents: analysis.arrearsIptuCents,
          arrearsCondoCents: analysis.arrearsCondoCents,
          evictionCostCents: analysis.evictionCostCents,
          otherAcquisitionCents: analysis.otherAcquisitionCents,
          holdingMonths: analysis.holdingMonths,
          monthlyHoldingCents: analysis.monthlyHoldingCents,
          financedAmountCents: analysis.financedAmountCents,
          annualRateBps: analysis.annualRateBps,
          brokerCommissionBps: analysis.brokerCommissionBps,
          expectedSalePriceCents: analysis.expectedSalePriceCents,
          capitalGainsRateBps: analysis.capitalGainsRateBps,
          items: analysis.items.map((item) => ({
            presetKey: item.presetKey,
            label: item.label,
            categoryKey: item.categoryKey,
            quantity: item.quantity.toNumber(),
            unit: item.unit,
            unitPriceCents: item.unitPriceCents,
            sortOrder: item.sortOrder,
          })),
        }}
      />
    </section>
  );
}
