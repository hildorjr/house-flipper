import { prisma } from "@/lib/prisma";

export type Entitlements = {
  tier: "FREE" | "PRO";
  propertyLimit: number | null;
  editablePropertyIds: string[];
  canCreateProperty: boolean;
  isPro: boolean;
};

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const subscription = await prisma.subscription.findUnique({
    where: { ownerId: userId },
  });

  const isPro =
    subscription?.tier === "PRO" &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");

  const properties = await prisma.property.findMany({
    where: { ownerId: userId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (isPro) {
    return {
      tier: "PRO",
      propertyLimit: null,
      editablePropertyIds: properties.map((p) => p.id),
      canCreateProperty: true,
      isPro: true,
    };
  }

  const editableId = properties[0]?.id;
  return {
    tier: "FREE",
    propertyLimit: 1,
    editablePropertyIds: editableId ? [editableId] : [],
    canCreateProperty: properties.length < 1,
    isPro: false,
  };
}

export async function assertPropertyEditable(
  userId: string,
  propertyId: string,
) {
  const entitlements = await getEntitlements(userId);
  if (!entitlements.editablePropertyIds.includes(propertyId)) {
    throw new Error("PROPERTY_READ_ONLY");
  }
}
