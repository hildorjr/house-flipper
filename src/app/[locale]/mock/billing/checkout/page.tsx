import { getTranslations } from "next-intl/server";
import { MockCheckoutForm } from "@/components/mock/mock-checkout-form";

type PageProps = {
  searchParams: Promise<{ interval?: string }>;
};

export default async function MockCheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const interval = params.interval === "annual" ? "annual" : "monthly";
  const t = await getTranslations("billing");
  const tMock = await getTranslations("mock");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-lg flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          {tMock("checkoutTitle")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("upgrade")}</h1>
        <p className="text-muted-foreground">
          {interval === "annual" ? t("annual") : t("monthly")} · {tMock("noCharge")}
        </p>
      </div>
      <MockCheckoutForm interval={interval} />
    </main>
  );
}
