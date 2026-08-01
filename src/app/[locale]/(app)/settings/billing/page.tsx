import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { requireUser } from "@/server/auth";
import { getSubscription } from "@/server/data/subscriptions";
import { BillingActions } from "./billing-actions";

export default async function BillingPage() {
  const user = await requireUser();
  const [t, subscription] = await Promise.all([
    getTranslations("billing"),
    getSubscription(user.id),
  ]);
  const isPro =
    subscription?.tier === "PRO" &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");
  const canManage =
    Boolean(subscription?.stripeSubscriptionId) ||
    (isMockThirdParty() && isPro);

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <PageHeader title={t("title")} description={t("propertyLimit")} />
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {isPro ? t("pro") : t("free")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t("features")}</p>
        </div>
        <BillingActions canManage={canManage} />
      </div>
    </section>
  );
}
