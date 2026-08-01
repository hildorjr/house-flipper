import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CostSummary } from "@/components/summary/cost-summary";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/server/auth";
import { getProperty } from "@/server/data/properties";
import { getPropertySummaryInput } from "@/server/data/summary";
import { PropertyForm } from "../property-form";
import { PropertyActions } from "./property-actions";

type PropertyPageProps = {
  params: Promise<{ propertyId: string }>;
};

function dateValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, entitlements, summaryInput, tProperties, tExport] =
    await Promise.all([
      getProperty(user.id, propertyId),
      getEntitlements(user.id),
      getPropertySummaryInput(user.id, propertyId),
      getTranslations("properties"),
      getTranslations("export"),
    ]);

  if (!property || !summaryInput) notFound();

  const readOnly = !entitlements.editablePropertyIds.includes(property.id);
  const values = {
    ...property,
    areaTotalM2: property.areaTotalM2?.toNumber() ?? null,
    areaBuiltM2: property.areaBuiltM2?.toNumber() ?? null,
    purchaseDate: dateValue(property.purchaseDate),
    soldDate: dateValue(property.soldDate),
  };

  return (
    <div className="space-y-8">
      {readOnly && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100 px-4 py-3 text-sm">
          {tProperties("readOnlyBanner")}
        </p>
      )}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{tProperties("overviewHint")}</p>
        <CostSummary input={summaryInput} currency={property.currency} />
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/properties/${property.id}/export/csv`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          {tExport("csv")}
        </a>
        <Link
          href={`/properties/${property.id}/report`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          {tExport("pdf")}
        </Link>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {tProperties("edit")}
        </h2>
        <PropertyForm
          propertyId={property.id}
          initialValues={values}
          readOnly={readOnly}
        />
        <PropertyActions propertyId={property.id} readOnly={readOnly} />
      </div>
    </div>
  );
}
