import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import type { Prisma } from "@/generated/prisma/client";

export type DealItemData = Omit<
  Prisma.DealAnalysisItemUncheckedCreateWithoutAnalysisInput,
  "id" | "analysisId"
>;
type DealCreateData = Omit<
  Prisma.DealAnalysisUncheckedCreateInput,
  "id" | "ownerId" | "createdAt" | "updatedAt"
> & { items?: DealItemData[] };
type DealUpdateData = Omit<
  Prisma.DealAnalysisUncheckedUpdateInput,
  "id" | "ownerId" | "createdAt" | "updatedAt"
> & { items?: DealItemData[] };

export async function listDealAnalyses(userId: string) {
  return prisma.dealAnalysis.findMany({
    where: { ownerId: userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDealAnalysis(userId: string, analysisId: string) {
  return prisma.dealAnalysis.findFirst({
    where: { id: analysisId, ownerId: userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createDealAnalysis(userId: string, data: DealCreateData) {
  const { items, ...analysis } = data;
  return prisma.dealAnalysis.create({
    data: {
      ...analysis,
      ownerId: userId,
      items: items ? { createMany: { data: items } } : undefined,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function updateDealAnalysis(
  userId: string,
  analysisId: string,
  data: DealUpdateData,
) {
  const existing = await getDealAnalysis(userId, analysisId);
  if (!existing) throw new Error("DEAL_ANALYSIS_NOT_FOUND");
  const { items, ...analysis } = data;
  return prisma.dealAnalysis.update({
    where: { id: analysisId },
    data: {
      ...analysis,
      items: items
        ? { deleteMany: {}, createMany: { data: items } }
        : undefined,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function deleteDealAnalysis(userId: string, analysisId: string) {
  const analysis = await getDealAnalysis(userId, analysisId);
  if (!analysis) throw new Error("DEAL_ANALYSIS_NOT_FOUND");
  return prisma.dealAnalysis.delete({ where: { id: analysisId } });
}

export async function convertDealToProperty(userId: string, analysisId: string) {
  const analysis = await getDealAnalysis(userId, analysisId);
  if (!analysis) throw new Error("DEAL_ANALYSIS_NOT_FOUND");
  if (analysis.convertedPropertyId) throw new Error("DEAL_ALREADY_CONVERTED");
  const { canCreateProperty } = await getEntitlements(userId);
  if (!canCreateProperty) throw new Error("PROPERTY_LIMIT_REACHED");

  const categories = await prisma.expenseCategory.findMany({
    where: {
      key: { in: [...new Set(analysis.items.map((item) => item.categoryKey))] },
      OR: [{ isSystem: true }, { ownerId: userId }],
    },
    select: { id: true, key: true },
  });
  const categoryByKey = new Map(categories.flatMap((category) =>
    category.key ? [[category.key, category.id] as const] : [],
  ));
  if (categoryByKey.size !== new Set(analysis.items.map((item) => item.categoryKey)).size) {
    throw new Error("DEAL_CATEGORY_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        ownerId: userId,
        label: analysis.name,
        type: analysis.propertyType,
        status: "PROSPECT",
        acquisitionChannel: analysis.acquisitionChannel,
        currency: analysis.currency,
        city: analysis.city,
        state: analysis.state,
        country: analysis.country,
        areaBuiltM2: analysis.areaBuiltM2,
        purchasePriceCents: analysis.purchasePriceCents,
        appraisedValueCents: analysis.appraisedValueCents,
        targetSalePriceCents: analysis.expectedSalePriceCents,
        itbiRateBps: analysis.itbiRateBps,
        auctionCommissionBps: analysis.auctionCommissionBps,
        brokerCommissionBps: analysis.brokerCommissionBps,
        capitalGainsRateBps: analysis.capitalGainsRateBps,
      },
    });
    const expenses = analysis.items.map((item) => ({
      propertyId: property.id,
      categoryId: categoryByKey.get(item.categoryKey)!,
      description: item.label,
      amountCents: Math.round(Number(item.quantity) * item.unitPriceCents),
      incurredOn: new Date(),
      status: "PLANNED" as const,
    }));
    await tx.expense.createMany({ data: expenses });
    await tx.task.createMany({
      data: analysis.items.map((item) => ({
        propertyId: property.id,
        title: item.label,
        categoryId: categoryByKey.get(item.categoryKey)!,
        plannedBudgetCents: Math.round(Number(item.quantity) * item.unitPriceCents),
        sortOrder: item.sortOrder,
      })),
    });
    await tx.dealAnalysis.update({
      where: { id: analysisId },
      data: { convertedPropertyId: property.id },
    });
    return property;
  });
}
