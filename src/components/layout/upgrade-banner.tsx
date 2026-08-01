"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function UpgradeBanner() {
  const t = useTranslations("upgradeBanner");

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="font-medium tracking-tight text-foreground">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </div>
      <Link
        href="/settings/billing"
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
