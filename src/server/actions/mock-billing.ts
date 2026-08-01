"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { activateMockPro, cancelMockPro } from "@/lib/mock/billing";
import { requireUser } from "@/server/auth";
import type { ActionResult } from "@/lib/utils";

export async function confirmMockCheckout(
  interval: "monthly" | "annual",
): Promise<ActionResult> {
  if (!isMockThirdParty()) return { ok: false, error: "Mocks are disabled" };
  try {
    const user = await requireUser();
    await activateMockPro(user.id, interval);
    const locale = await getLocale();
    redirect({ href: "/settings/billing?checkout=success", locale });
    return { ok: true, data: undefined };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to activate Pro",
    };
  }
}

export async function cancelMockSubscription(): Promise<ActionResult> {
  if (!isMockThirdParty()) return { ok: false, error: "Mocks are disabled" };
  try {
    const user = await requireUser();
    await cancelMockPro(user.id);
    const locale = await getLocale();
    redirect({ href: "/settings/billing", locale });
    return { ok: true, data: undefined };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to cancel",
    };
  }
}
