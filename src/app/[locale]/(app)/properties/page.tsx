import { Building2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { MoneyDisplay } from "@/components/money-display";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEntitlements } from "@/lib/entitlements";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";
import { listProperties } from "@/server/data/properties";

type PropertiesPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statuses = [
  "PROSPECT",
  "UNDER_CONTRACT",
  "OWNED_RENOVATING",
  "LISTED",
  "SOLD",
] as const;

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const t = await getTranslations("properties");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("propertyStatus");
  const locale = await getLocale();
  const { status } = await searchParams;
  const user = await requireUser();
  const [properties, entitlements] = await Promise.all([
    listProperties(user.id),
    getEntitlements(user.id),
  ]);
  const filteredProperties = statuses.includes(status as (typeof statuses)[number])
    ? properties.filter((property) => property.status === status)
    : properties;

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          entitlements.canCreateProperty ? (
            <Link href="/properties/new" className={cn(buttonVariants(), "rounded-xl")}>
              {t("new")}
            </Link>
          ) : (
            <Button disabled className="rounded-xl">
              {t("new")}
            </Button>
          )
        }
      />

      {!entitlements.canCreateProperty && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100 px-4 py-3 text-sm">
          {t("createLimitBanner")}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/properties"
          className={cn(
            buttonVariants({
              variant: !status ? "default" : "outline",
              size: "sm",
            }),
            "rounded-full",
          )}
        >
          {tCommon("all")}
        </Link>
        {statuses.map((value) => (
          <Link
            key={value}
            href={{ pathname: "/properties", query: { status: value } }}
            className={cn(
              buttonVariants({
                variant: status === value ? "default" : "outline",
                size: "sm",
              }),
              "rounded-full whitespace-nowrap",
            )}
          >
            {tStatus(value)}
          </Link>
        ))}
      </div>

      {filteredProperties.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={<Building2 className="size-6" />}
          action={
            entitlements.canCreateProperty ? (
              <Link href="/properties/new" className={cn(buttonVariants(), "rounded-xl")}>
                {t("emptyCta")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => {
            const editable = entitlements.editablePropertyIds.includes(property.id);
            const location =
              [property.city, property.state].filter(Boolean).join(", ") ||
              t("locationUnknown");

            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group block rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <h2 className="truncate text-base font-semibold tracking-tight group-hover:text-primary">
                      {property.label}
                    </h2>
                    <StatusBadge status={property.status} />
                  </div>
                  {!editable && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t("readOnlyShort")}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm text-muted-foreground">{location}</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight">
                    {property.purchasePriceCents == null ? (
                      tCommon("noValue")
                    ) : (
                      <MoneyDisplay
                        cents={property.purchasePriceCents}
                        currency={property.currency}
                        locale={locale}
                      />
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
