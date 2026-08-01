import { createAdminClient } from "@/lib/supabase/admin";
import { isMockThirdParty, MOCK_STORAGE_BUCKET } from "@/lib/mock/enabled";
import { mockDownloadUrl, mockReadFile } from "@/lib/mock/storage";
import { getSessionUser } from "@/server/auth";
import { allowedMimeType, getAttachment, isInlineMimeType } from "@/server/data/attachments";

export const runtime = "nodejs";

function contentDisposition(fileName: string, inline: boolean) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { attachmentId } = await params;
  const attachment = await getAttachment(user.id, attachmentId);
  if (!attachment) return Response.json({ error: "Not found" }, { status: 404 });

  const mimeType = allowedMimeType(attachment.mimeType) ?? "application/octet-stream";

  if (isMockThirdParty()) {
    try {
      const bytes = await mockReadFile(attachment.storagePath);
      return new Response(bytes, {
        headers: {
          "content-type": mimeType,
          "content-disposition": contentDisposition(
            attachment.fileName,
            isInlineMimeType(mimeType),
          ),
          "x-content-type-options": "nosniff",
          "cache-control": "private, max-age=60",
        },
      });
    } catch {
      return Response.redirect(mockDownloadUrl(attachment.storagePath));
    }
  }

  const { data, error } = await createAdminClient()
    .storage
    .from(MOCK_STORAGE_BUCKET)
    .createSignedUrl(
      attachment.storagePath,
      60,
      isInlineMimeType(mimeType) ? undefined : { download: attachment.fileName },
    );
  if (error || !data?.signedUrl) {
    return Response.json({ error: "File unavailable" }, { status: 404 });
  }

  return Response.redirect(data.signedUrl);
}
