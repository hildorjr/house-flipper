"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { archivePropertyAction } from "@/server/actions/properties";
import { useRouter } from "@/i18n/navigation";

export function PropertyActions({ propertyId, readOnly }: { propertyId: string; readOnly: boolean }) {
  const t = useTranslations("properties");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (readOnly) return null;

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await archivePropertyAction(propertyId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(tCommon("success"));
          router.replace("/properties");
        });
      }}
    >
      {t("archive")}
    </Button>
  );
}
