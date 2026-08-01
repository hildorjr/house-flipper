"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createSignedUpload } from "@/server/actions/attachments";

type AttachmentKind =
  | "RECEIPT"
  | "INVOICE"
  | "CONTRACT"
  | "DEED"
  | "PHOTO_BEFORE"
  | "PHOTO_AFTER"
  | "REPORT"
  | "OTHER";

async function compressImage(file: File) {
  if (!file.type.startsWith("image/") || file.size <= 10 * 1024 * 1024) return file;

  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  image.close();
  return blob
    ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
        type: "image/jpeg",
      })
    : file;
}

export function UploadButton({
  propertyId,
  kind = "OTHER",
}: {
  propertyId: string;
  kind?: AttachmentKind;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations("documents");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  function upload(file: File) {
    startTransition(async () => {
      try {
        setIsUploading(true);
        const prepared = await compressImage(file);
        if (prepared.size > 10 * 1024 * 1024) {
          toast.error(t("uploadTooLarge"));
          return;
        }
        const result = await createSignedUpload({
          propertyId,
          fileName: prepared.name,
          mimeType: prepared.type,
          sizeBytes: prepared.size,
          kind,
        });
        if (!result.ok) {
          toast.error(
            result.error === "UNSUPPORTED_FILE_TYPE"
              ? t("uploadUnsupportedType")
              : result.error,
          );
          return;
        }
        const response = await fetch(result.data.signedUrl, {
          method: "PUT",
          headers: { "content-type": prepared.type },
          body: prepared,
        });
        if (!response.ok) {
          toast.error(t("uploadFailed"));
          return;
        }
        router.refresh();
      } catch {
        toast.error(t("uploadFailed"));
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) upload(file);
        }}
      />
      <Button
        type="button"
        className="rounded-xl"
        disabled={isPending || isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {isUploading ? tCommon("loading") : t("upload")}
      </Button>
    </>
  );
}
