import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type ProfileUpdateData = Omit<
  Prisma.ProfileUncheckedUpdateInput,
  "id" | "stripeCustomerId" | "createdAt" | "updatedAt"
>;

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { id: userId } });
}

export async function getProfileByStripeCustomerId(stripeCustomerId: string) {
  return prisma.profile.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
) {
  return prisma.profile.update({
    where: { id: userId },
    data: { stripeCustomerId },
  });
}

export async function updateProfile(userId: string, data: ProfileUpdateData) {
  return prisma.profile.update({ where: { id: userId }, data });
}
