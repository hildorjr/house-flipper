"use server";

import { randomUUID } from "crypto";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { isMockThirdParty, MOCK_STORAGE_BUCKET } from "@/lib/mock/enabled";
import { mockDeleteFile, mockUploadUrl } from "@/lib/mock/storage";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import {
  ALLOWED_MIME_TYPES,
  createAttachmentRecord,
  deleteAttachment as deleteAttachmentRecord,
  getAttachment,
} from "@/server/data/attachments";

const attachmentSchema = z
  .object({
    propertyId: z.string().uuid().optional(),
    expenseId: z.string().uuid().optional(),
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .transform((value) => value.replace(/[\u0000-\u001f\u007f"\\/]/g, "_")),
    mimeType: z.enum(ALLOWED_MIME_TYPES),
    sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
    kind: z.enum([
      "RECEIPT",
      "INVOICE",
      "CONTRACT",
      "DEED",
      "PHOTO_BEFORE",
      "PHOTO_AFTER",
      "REPORT",
      "OTHER",
    ]),
  })
  .refine((value) => Boolean(value.propertyId) !== Boolean(value.expenseId));

function extension(fileName: string) {
  const value = fileName.split(".").pop()?.toLowerCase();
  return value && /^[a-z0-9]{1,10}$/.test(value) ? `.${value}` : "";
}

function errorResult(error: unknown): ActionResult<{ attachmentId: string; signedUrl: string }> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Unable to upload file.",
  };
}

type SignedUploadInput = Omit<z.input<typeof attachmentSchema>, "mimeType"> & {
  mimeType: string;
};

export async function createSignedUpload(
  input: SignedUploadInput,
): Promise<ActionResult<{ attachmentId: string; signedUrl: string }>> {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) {
    const rejectedType = parsed.error.issues.some((issue) => issue.path[0] === "mimeType");
    return { ok: false, error: rejectedType ? "UNSUPPORTED_FILE_TYPE" : "Invalid file." };
  }

  try {
    const user = await requireUser();
    const storagePath = `${user.id}/${randomUUID()}${extension(parsed.data.fileName)}`;
    const attachment = await createAttachmentRecord(user.id, {
      propertyId: parsed.data.propertyId,
      expenseId: parsed.data.expenseId,
      kind: parsed.data.kind,
      storagePath,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });

    if (isMockThirdParty()) {
      return {
        ok: true,
        data: {
          attachmentId: attachment.id,
          signedUrl: mockUploadUrl(storagePath),
        },
      };
    }

    const { data, error } = await createAdminClient()
      .storage
      .from(MOCK_STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data?.signedUrl) {
      await deleteAttachmentRecord(user.id, attachment.id);
      throw new Error(error?.message ?? "Unable to create upload URL.");
    }

    return { ok: true, data: { attachmentId: attachment.id, signedUrl: data.signedUrl } };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(attachmentId).success) {
    return { ok: false, error: "Invalid attachment." };
  }

  try {
    const user = await requireUser();
    const attachment = await getAttachment(user.id, attachmentId);
    if (!attachment) throw new Error("ATTACHMENT_NOT_FOUND");

    if (isMockThirdParty()) {
      await mockDeleteFile(attachment.storagePath);
    } else {
      const { error } = await createAdminClient()
        .storage
        .from(MOCK_STORAGE_BUCKET)
        .remove([attachment.storagePath]);
      if (error) throw new Error(error.message);
    }

    await deleteAttachmentRecord(user.id, attachmentId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to delete file.",
    };
  }
}
