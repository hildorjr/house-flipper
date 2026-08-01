import { prisma } from "@/lib/prisma";
import { assertPropertyEditable } from "@/lib/entitlements";
import type { Prisma } from "@/generated/prisma/client";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const INLINE_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

export function allowedMimeType(value: string): AllowedMimeType | null {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value)
    ? (value as AllowedMimeType)
    : null;
}

export function isInlineMimeType(value: string) {
  return INLINE_MIME_TYPES.includes(value);
}

export type AttachmentFilters = { propertyId?: string; expenseId?: string };
type AttachmentCreateData = Omit<
  Prisma.AttachmentUncheckedCreateInput,
  "id" | "ownerId" | "createdAt"
>;

export async function listAttachments(
  userId: string,
  filters: AttachmentFilters = {},
) {
  return prisma.attachment.findMany({
    where: {
      propertyId: filters.propertyId,
      expenseId: filters.expenseId,
      OR: [
        { property: { ownerId: userId } },
        { expense: { property: { ownerId: userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAttachmentRecord(
  userId: string,
  data: AttachmentCreateData,
) {
  if (Boolean(data.propertyId) === Boolean(data.expenseId)) {
    throw new Error("ATTACHMENT_PARENT_REQUIRED");
  }
  const propertyId =
    data.propertyId ??
    (data.expenseId
      ? (
          await prisma.expense.findFirst({
            where: { id: data.expenseId, property: { ownerId: userId } },
            select: { propertyId: true },
          })
        )?.propertyId
      : undefined);
  if (!propertyId) throw new Error("ATTACHMENT_PARENT_NOT_FOUND");
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: userId },
    select: { id: true },
  });
  if (!property) throw new Error("PROPERTY_NOT_FOUND");
  await assertPropertyEditable(userId, propertyId);
  return prisma.attachment.create({ data: { ...data, ownerId: userId } });
}

export async function getAttachment(userId: string, attachmentId: string) {
  return prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      OR: [
        { property: { ownerId: userId } },
        { expense: { property: { ownerId: userId } } },
      ],
    },
  });
}

export async function deleteAttachment(userId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, ownerId: userId },
    select: { id: true, propertyId: true, expense: { select: { propertyId: true } } },
  });
  if (!attachment) throw new Error("ATTACHMENT_NOT_FOUND");
  await assertPropertyEditable(
    userId,
    attachment.propertyId ?? attachment.expense!.propertyId,
  );
  return prisma.attachment.delete({ where: { id: attachmentId } });
}
