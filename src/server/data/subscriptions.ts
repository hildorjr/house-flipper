import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type StripeSubscriptionData = Omit<
  Prisma.SubscriptionUncheckedCreateInput,
  "id" | "ownerId" | "updatedAt"
>;

export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { ownerId: userId } });
}

export async function upsertFromStripe(
  userId: string,
  data: StripeSubscriptionData,
) {
  return prisma.subscription.upsert({
    where: { ownerId: userId },
    create: { ...data, ownerId: userId },
    update: data,
  });
}
