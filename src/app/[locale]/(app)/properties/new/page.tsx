import { getTranslations } from "next-intl/server";

import { PropertyForm } from "../property-form";

export default async function NewPropertyPage() {
  const t = await getTranslations("properties");

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
      <PropertyForm />
    </section>
  );
}
