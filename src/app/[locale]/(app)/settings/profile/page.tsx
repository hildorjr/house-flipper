import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireUser } from "@/server/auth";
import { getProfile } from "@/server/data/profiles";

export default async function ProfilePage() {
  const t = await getTranslations("settings");
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <PageHeader title={t("profile")} description={t("subtitle")} />
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <ProfileForm
          fullName={profile?.fullName ?? null}
          phone={profile?.phone ?? null}
          locale={profile?.locale ?? "pt-BR"}
          currency={profile?.currency ?? "BRL"}
          email={profile?.email ?? user.email}
        />
      </div>
    </section>
  );
}
