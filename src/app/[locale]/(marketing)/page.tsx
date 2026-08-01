import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type MarketingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing");
  const tBrand = await getTranslations("brand");

  const features = [
    { title: t("feature1Title"), desc: t("feature1Desc") },
    { title: t("feature2Title"), desc: t("feature2Desc") },
    { title: t("feature3Title"), desc: t("feature3Desc") },
  ] as const;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 surface-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-[28rem] max-w-5xl opacity-30 dark:opacity-20 [background-image:url('data:image/svg+xml,%3Csvg_width%3D%2260%22_height%3D%2260%22_viewBox%3D%220_0_60_60%22_xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg_fill%3D%22none%22_fill-rule%3D%22evenodd%22%3E%3Cg_fill%3D%22%231a5c4a%22_fill-opacity%3D%220.08%22%3E%3Cpath_d%3D%22M36_34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6_34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6_4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{tBrand("name")}</span>
        </div>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="ghost"
          className="min-h-10"
        >
          {t("ctaSecondary")}
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-16 pt-8 sm:pt-12">
        <section className="mx-auto max-w-2xl space-y-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <p className="text-sm font-medium tracking-wide text-primary">
            {tBrand("tagline")}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              size="lg"
              className="min-h-12 min-w-44 rounded-xl"
            >
              {t("cta")}
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="min-h-12 min-w-44 rounded-xl bg-background/60"
            >
              {t("ctaSecondary")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("freeNote")}</p>
        </section>

        <section className="mx-auto mt-20 grid w-full max-w-4xl gap-8 border-t border-primary/10 pt-12 sm:grid-cols-3 sm:gap-6 animate-in fade-in duration-1000 fill-mode-both delay-150">
          {features.map((feature) => (
            <div key={feature.title} className="space-y-2 text-left sm:text-center">
              <h2 className="font-semibold tracking-tight">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
