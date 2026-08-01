import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader } from "@/components/page-header";
import { Link } from "@/i18n/navigation";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  const items = [
    { href: "/settings/profile", label: t("profile") },
    { href: "/settings/billing", label: t("billing") },
    { href: "/settings/preferences", label: t("preferences") },
  ] as const;

  return (
    <section className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {items.map(({ href, label }, index) => (
          <Link
            key={href}
            href={href}
            className={`flex min-h-14 items-center justify-between px-4 py-3 font-medium transition-colors hover:bg-muted/50 ${
              index > 0 ? "border-t" : ""
            }`}
          >
            {label}
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <SignOutButton className="min-h-14 w-full flex-row-reverse justify-between px-4 py-3 font-medium hover:bg-muted/50" />
      </div>
    </section>
  );
}
