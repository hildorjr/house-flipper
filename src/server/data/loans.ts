import { prisma } from "@/lib/prisma";
import { assertPropertyEditable } from "@/lib/entitlements";
import { buildAmortizationSchedule } from "@/lib/finance";
import type { Prisma } from "@/generated/prisma/client";

type LoanCreateData = Omit<
  Prisma.LoanUncheckedCreateInput,
  "id" | "propertyId" | "installments"
>;

export async function listLoans(userId: string, propertyId?: string) {
  return prisma.loan.findMany({
    where: { propertyId, property: { ownerId: userId } },
    include: { installments: { orderBy: { number: "asc" } } },
    orderBy: { firstDueDate: "asc" },
  });
}

export async function createLoan(
  userId: string,
  propertyId: string,
  data: LoanCreateData,
) {
  await assertPropertyEditable(userId, propertyId);
  const installments = buildAmortizationSchedule({
    ...data,
    system: data.system ?? "SAC",
    firstDueDate: new Date(data.firstDueDate),
  });
  return prisma.loan.create({
    data: {
      ...data,
      propertyId,
      installments: { createMany: { data: installments } },
    },
    include: { installments: { orderBy: { number: "asc" } } },
  });
}

export async function deleteLoan(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, property: { ownerId: userId } },
    select: { propertyId: true },
  });
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  await assertPropertyEditable(userId, loan.propertyId);
  return prisma.loan.delete({ where: { id: loanId } });
}

async function getOwnedInstallment(userId: string, installmentId: string) {
  return prisma.loanInstallment.findFirst({
    where: { id: installmentId, loan: { property: { ownerId: userId } } },
    include: { loan: { select: { propertyId: true } } },
  });
}

export async function markInstallmentPaid(
  userId: string,
  installmentId: string,
  paidOn = new Date(),
) {
  const installment = await getOwnedInstallment(userId, installmentId);
  if (!installment) throw new Error("INSTALLMENT_NOT_FOUND");
  await assertPropertyEditable(userId, installment.loan.propertyId);
  const category = await prisma.expenseCategory.findFirst({
    where: { key: "loan_interest", isSystem: true },
    select: { id: true },
  });
  if (!category) throw new Error("LOAN_INTEREST_CATEGORY_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loanInstallment.update({
      where: { id: installmentId },
      data: { paidOn },
    });
    await tx.expense.upsert({
      where: { loanInstallmentId: installmentId },
      create: {
        propertyId: installment.loan.propertyId,
        categoryId: category.id,
        loanInstallmentId: installmentId,
        description: `Loan installment ${installment.number}`,
        amountCents: installment.interestCents + installment.feesCents,
        incurredOn: installment.dueDate,
        paidOn,
        status: "PAID",
      },
      update: {
        amountCents: installment.interestCents + installment.feesCents,
        incurredOn: installment.dueDate,
        paidOn,
        status: "PAID",
      },
    });
    return updated;
  });
}

export async function unmarkInstallmentPaid(
  userId: string,
  installmentId: string,
) {
  const installment = await getOwnedInstallment(userId, installmentId);
  if (!installment) throw new Error("INSTALLMENT_NOT_FOUND");
  await assertPropertyEditable(userId, installment.loan.propertyId);
  return prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany({ where: { loanInstallmentId: installmentId } });
    return tx.loanInstallment.update({
      where: { id: installmentId },
      data: { paidOn: null },
    });
  });
}
