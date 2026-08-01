import { prisma } from "@/lib/prisma";
import type { PropertySummaryInput } from "@/lib/finance";

export async function getPropertySummaryInput(
  userId: string,
  propertyId: string,
): Promise<PropertySummaryInput | null> {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: userId },
    include: {
      expenses: { include: { category: true } },
      loans: { include: { installments: true } },
    },
  });
  if (!property) return null;

  return {
    purchasePriceCents: property.purchasePriceCents ?? 0,
    purchaseDate: property.purchaseDate,
    targetSalePriceCents: property.targetSalePriceCents,
    soldPriceCents: property.soldPriceCents,
    soldDate: property.soldDate,
    brokerCommissionBps: property.brokerCommissionBps ?? 0,
    capitalGainsRateBps: property.capitalGainsRateBps ?? 0,
    itbiRateBps: property.itbiRateBps ?? 0,
    auctionCommissionBps: property.auctionCommissionBps ?? 0,
    expenses: property.expenses.map((expense) => ({
      amountCents: expense.amountCents,
      status: expense.status,
      group: expense.category.group,
      categoryKey: expense.category.key,
      categoryName: expense.category.name,
      incurredOn: expense.incurredOn,
      isLoanInterestOrFee: expense.loanInstallmentId !== null,
    })),
    loans: property.loans.map((loan) => ({
      principalCents: loan.principalCents,
      installments: loan.installments.map((installment) => ({
        principalCents: installment.principalCents,
        interestCents: installment.interestCents,
        feesCents: installment.feesCents,
        paidOn: installment.paidOn,
      })),
    })),
  };
}
