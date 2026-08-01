"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LocaleErrorProps = {
  unstable_retry: () => void;
};

export default function LocaleError({ unstable_retry }: LocaleErrorProps) {
  const t = useTranslations("errors");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        title={t("title")}
        description={t("description")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="rounded-xl" onClick={() => unstable_retry()}>
              {t("retry")}
            </Button>
            <Link
              href="/properties"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              {t("backHome")}
            </Link>
          </div>
        }
      />
    </div>
  );
}
