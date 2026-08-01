import { prisma } from "@/lib/prisma";

export async function listRenovationPresets(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { country: true },
  });
  return prisma.renovationPreset.findMany({
    where: { country: profile?.country ?? "BR" },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
}
