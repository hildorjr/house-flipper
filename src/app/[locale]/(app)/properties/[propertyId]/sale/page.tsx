import { notFound } from "next/navigation";

import { SaleForm } from "@/components/sale/sale-form";
import { getEntitlements } from "@/lib/entitlements";
import { summarizeProperty } from "@/lib/finance";
import { requireUser } from "@/server/auth";
import { getProperty } from "@/server/data/properties";
import { getPropertySummaryInput } from "@/server/data/summary";

type SalePageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function SalePage({ params }: SalePageProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, entitlements, input] = await Promise.all([
    getProperty(user.id, propertyId),
    getEntitlements(user.id),
    getPropertySummaryInput(user.id, propertyId),
  ]);
  if (!property || !input) notFound();
  const summary = summarizeProperty(input);

  return (
    <SaleForm
      propertyId={property.id}
      currency={property.currency}
      readOnly={!entitlements.editablePropertyIds.includes(property.id)}
      capitalGainsCents={summary.capitalGainsEstimateCents}
      netProfitCents={summary.netProfitActual}
      roi={summary.roiOnCashActual}
      initialValues={{
        targetSalePriceCents: property.targetSalePriceCents,
        soldPriceCents: property.soldPriceCents,
        soldDate: property.soldDate?.toISOString().slice(0, 10) ?? null,
        brokerCommissionBps: property.brokerCommissionBps ?? 0,
        capitalGainsRateBps: property.capitalGainsRateBps ?? 0,
      }}
    />
  );
}
