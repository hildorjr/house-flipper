import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";
import { getProperty } from "@/server/data/properties";
import { PropertyTabs } from "./property-tabs";

type PropertyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ propertyId: string }>;
};

export default async function PropertyLayout({ children, params }: PropertyLayoutProps) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [property, t] = await Promise.all([
    getProperty(user.id, propertyId),
    getTranslations("nav"),
  ]);

  if (!property) notFound();

  const tabs = [
    ["", t("overview")],
    ["/costs", t("costs")],
    ["/tasks", t("tasks")],
    ["/financing", t("financing")],
    ["/documents", t("documents")],
    ["/sale", t("sale")],
  ] as const;
  const basePath = `/properties/${propertyId}`;
  const location = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("backToProperties")}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {property.label}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={property.status} />
              {location && (
                <span className="text-sm text-muted-foreground">{location}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <PropertyTabs basePath={basePath} tabs={tabs} />
      {children}
    </section>
  );
}
