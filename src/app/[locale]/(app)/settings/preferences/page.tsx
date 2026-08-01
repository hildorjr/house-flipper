import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { ThemePreference } from "@/components/settings/theme-preference";

export default async function PreferencesPage() {
  const t = await getTranslations("settings");

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <PageHeader title={t("preferences")} description={t("subtitle")} />
      <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium">{t("theme")}</p>
        <ThemePreference />
      </div>
    </section>
  );
}
