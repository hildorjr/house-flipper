import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";

export async function PropertyPlaceholder({
  namespace,
  titleKey = "title",
}: {
  namespace: "expenses" | "tasks" | "financing" | "documents" | "sale" | "properties";
  titleKey?: string;
}) {
  const t = await getTranslations(namespace);

  return <EmptyState title={t(titleKey)} description={t("empty")} />;
}
