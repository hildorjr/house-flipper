"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cancelMockSubscription } from "@/server/actions/mock-billing";

export function MockPortalForm() {
  const t = useTranslations("billing");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      className="min-h-11"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await cancelMockSubscription();
          if (result && !result.ok) toast.error(result.error);
        });
      }}
    >
      {t("free")}
    </Button>
  );
}
