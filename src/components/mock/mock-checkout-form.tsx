"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { confirmMockCheckout } from "@/server/actions/mock-billing";

export function MockCheckoutForm({
  interval,
}: {
  interval: "monthly" | "annual";
}) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="min-h-11"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await confirmMockCheckout(interval);
            if (result && !result.ok) toast.error(result.error);
          });
        }}
      >
        {t("upgrade")}
      </Button>
      <p className="text-sm text-muted-foreground">{tc("confirm")}</p>
    </div>
  );
}
