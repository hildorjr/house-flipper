import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default async function LocaleNotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={
          <Link
            href="/properties"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {t("backHome")}
          </Link>
        }
      />
    </div>
  );
}
