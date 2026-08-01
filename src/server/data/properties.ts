import { prisma } from "@/lib/prisma";
import { assertPropertyEditable, getEntitlements } from "@/lib/entitlements";
import type { Prisma, PropertyStatus } from "@/generated/prisma/client";

type PropertyCreateData = Omit<
  Prisma.PropertyUncheckedCreateInput,
  "id" | "ownerId" | "createdAt" | "updatedAt" | "archivedAt"
>;
type PropertyUpdateData = Omit<
  Prisma.PropertyUncheckedUpdateInput,
  "id" | "ownerId" | "createdAt" | "updatedAt"
>;

export async function listProperties(userId: string, includeArchived = false) {
  return prisma.property.findMany({
    where: { ownerId: userId, ...(includeArchived ? {} : { archivedAt: null }) },
    orderBy: { updatedAt: "desc" },
  });
}

export async function countActiveProperties(userId: string) {
  return prisma.property.count({
    where: { ownerId: userId, archivedAt: null },
  });
}

export async function getProperty(userId: string, propertyId: string) {
  return prisma.property.findFirst({ where: { id: propertyId, ownerId: userId } });
}

export async function createProperty(userId: string, data: PropertyCreateData) {
  const { canCreateProperty } = await getEntitlements(userId);
  if (!canCreateProperty) throw new Error("PROPERTY_LIMIT_REACHED");
  return prisma.property.create({ data: { ...data, ownerId: userId } });
}

export async function updateProperty(
  userId: string,
  propertyId: string,
  data: PropertyUpdateData,
) {
  await assertPropertyEditable(userId, propertyId);
  return prisma.property.update({
    where: { id: propertyId, ownerId: userId },
    data,
  });
}

export async function archiveProperty(userId: string, propertyId: string) {
  await assertPropertyEditable(userId, propertyId);
  return prisma.property.update({
    where: { id: propertyId, ownerId: userId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

export async function updatePropertyStatus(
  userId: string,
  propertyId: string,
  status: PropertyStatus,
) {
  await assertPropertyEditable(userId, propertyId);
  return prisma.property.update({
    where: { id: propertyId, ownerId: userId },
    data: { status, archivedAt: status === "ARCHIVED" ? new Date() : null },
  });
}
