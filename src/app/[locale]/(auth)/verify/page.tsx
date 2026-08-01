import { Building2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { VerifyForm } from "@/components/auth/verify-form";
import { Link } from "@/i18n/navigation";
import { isMockThirdParty, MOCK_OTP_CODE } from "@/lib/mock/enabled";

type VerifyPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; phone?: string }>;
};

export default async function VerifyPage({
  params,
  searchParams,
}: VerifyPageProps) {
  const [{ locale }, { email, phone }] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);
  const tBrand = await getTranslations("brand");

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 surface-glow"
      />
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 text-lg font-semibold tracking-tight"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </span>
        {tBrand("name")}
      </Link>
      <VerifyForm
        email={email}
        phone={phone}
        mockOtpCode={isMockThirdParty() ? MOCK_OTP_CODE : undefined}
      />
    </main>
  );
}
