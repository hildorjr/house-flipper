import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { UploadButton } from "@/components/attachments/upload-button";
import { requireUser } from "@/server/auth";
import { isInlineMimeType, listAttachments } from "@/server/data/attachments";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const user = await requireUser();
  const [attachments, t] = await Promise.all([
    listAttachments(user.id, { propertyId }),
    getTranslations("documents"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        </div>
        <UploadButton propertyId={propertyId} />
      </div>
      {attachments.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={<FileText className="size-6" />}
          action={<UploadButton propertyId={propertyId} />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={`/api/files/${attachment.id}`}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              {isInlineMimeType(attachment.mimeType) ? (
                <div
                  role="img"
                  aria-label={attachment.fileName}
                  className="aspect-video w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(/api/files/${attachment.id})` }}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted/60">
                  <FileText className="size-10 text-muted-foreground" />
                </div>
              )}
              <div className="p-3.5">
                <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(attachment.kind)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
