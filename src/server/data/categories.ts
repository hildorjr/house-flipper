import { prisma } from "@/lib/prisma";

export async function listCategories(userId: string) {
  return prisma.expenseCategory.findMany({
    where: { OR: [{ isSystem: true }, { ownerId: userId }] },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryByKey(userId: string, key: string) {
  return prisma.expenseCategory.findFirst({
    where: { key, OR: [{ isSystem: true }, { ownerId: userId }] },
  });
}
