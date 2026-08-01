import { getTranslations } from "next-intl/server";

import { isMockThirdParty, MOCK_OTP_CODE } from "@/lib/mock/enabled";

export async function MockModeBanner() {
  if (!isMockThirdParty()) return null;

  const t = await getTranslations("mock");

  return (
    <div className="bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100">
      {t("banner", { code: MOCK_OTP_CODE })}
    </div>
  );
}
