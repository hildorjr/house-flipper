import { getTranslations } from "next-intl/server";
import { MockPortalForm } from "@/components/mock/mock-portal-form";
import { Link } from "@/i18n/navigation";

export default async function MockPortalPage() {
  const t = await getTranslations("billing");
  const tMock = await getTranslations("mock");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-lg flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          {tMock("portalTitle")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("manage")}</h1>
        <p className="text-muted-foreground">{t("currentPlan")}</p>
      </div>
      <MockPortalForm />
      <Link
        href="/settings/billing"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("title")}
      </Link>
    </main>
  );
}
