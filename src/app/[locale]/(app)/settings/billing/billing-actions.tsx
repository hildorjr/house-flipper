"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  createCheckoutSession,
  createPortalSession,
} from "@/server/actions/billing";

export function BillingActions({ canManage }: { canManage: boolean }) {
  const t = useTranslations("billing");
  const [isPending, startTransition] = useTransition();

  function openSession(action: () => Promise<{ ok: boolean; data?: string; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok || !result.data) {
        toast.error(result.error ?? t("stripeError"));
        return;
      }
      window.location.assign(result.data);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={isPending}
        onClick={() => openSession(() => createCheckoutSession("monthly"))}
      >
        {t("upgrade")} · {t("monthly")}
      </Button>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => openSession(() => createCheckoutSession("annual"))}
      >
        {t("upgrade")} · {t("annual")}
      </Button>
      {canManage && (
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => openSession(createPortalSession)}
        >
          {t("manage")}
        </Button>
      )}
    </div>
  );
}
