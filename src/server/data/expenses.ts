import { prisma } from "@/lib/prisma";
import { assertPropertyEditable } from "@/lib/entitlements";
import type {
  CostGroup,
  ExpenseStatus,
  Prisma,
} from "@/generated/prisma/client";

export type ExpenseFilters = {
  propertyId?: string;
  group?: CostGroup;
  categoryId?: string;
  status?: ExpenseStatus;
  from?: Date;
  to?: Date;
};

type ExpenseCreateData = Omit<
  Prisma.ExpenseUncheckedCreateInput,
  "id" | "propertyId" | "createdAt" | "updatedAt"
>;
type ExpenseUpdateData = Omit<
  Prisma.ExpenseUncheckedUpdateInput,
  "id" | "propertyId" | "createdAt" | "updatedAt"
>;

async function assertCategoryAccess(userId: string, categoryId: string) {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, OR: [{ isSystem: true }, { ownerId: userId }] },
    select: { id: true },
  });
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
}

async function assertReferenceAccess(
  userId: string,
  contactId: string | null | undefined,
  taskId: string | null | undefined,
) {
  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ownerId: userId },
      select: { id: true },
    });
    if (!contact) throw new Error("CONTACT_NOT_FOUND");
  }
  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, property: { ownerId: userId } },
      select: { id: true },
    });
    if (!task) throw new Error("TASK_NOT_FOUND");
  }
}

export async function listExpenses(userId: string, filters: ExpenseFilters = {}) {
  const { propertyId, group, categoryId, status, from, to } = filters;
  return prisma.expense.findMany({
    where: {
      property: { ownerId: userId },
      propertyId,
      categoryId,
      status,
      category: group ? { group } : undefined,
      incurredOn: from || to ? { gte: from, lte: to } : undefined,
    },
    include: { category: true, contact: true, task: true },
    orderBy: [{ incurredOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function getExpense(userId: string, expenseId: string) {
  return prisma.expense.findFirst({
    where: { id: expenseId, property: { ownerId: userId } },
    include: { category: true, contact: true, task: true, attachments: true },
  });
}

export async function createExpense(
  userId: string,
  propertyId: string,
  data: ExpenseCreateData,
) {
  await assertPropertyEditable(userId, propertyId);
  await assertCategoryAccess(userId, data.categoryId);
  await assertReferenceAccess(userId, data.contactId, data.taskId);
  return prisma.expense.create({ data: { ...data, propertyId } });
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  data: ExpenseUpdateData,
) {
  const expense = await getExpense(userId, expenseId);
  if (!expense) throw new Error("EXPENSE_NOT_FOUND");
  await assertPropertyEditable(userId, expense.propertyId);
  if (typeof data.categoryId === "string") {
    await assertCategoryAccess(userId, data.categoryId);
  }
  await assertReferenceAccess(
    userId,
    typeof data.contactId === "string" ? data.contactId : undefined,
    typeof data.taskId === "string" ? data.taskId : undefined,
  );
  return prisma.expense.update({ where: { id: expenseId }, data });
}

export async function deleteExpense(userId: string, expenseId: string) {
  const expense = await getExpense(userId, expenseId);
  if (!expense) throw new Error("EXPENSE_NOT_FOUND");
  await assertPropertyEditable(userId, expense.propertyId);
  return prisma.expense.delete({ where: { id: expenseId } });
}

export async function deleteExpenses(userId: string, expenseIds: string[]) {
  const expenses = await prisma.expense.findMany({
    where: { id: { in: expenseIds }, property: { ownerId: userId } },
    select: { id: true, propertyId: true },
  });
  if (expenses.length !== expenseIds.length) throw new Error("EXPENSE_NOT_FOUND");
  await Promise.all(
    [...new Set(expenses.map((expense) => expense.propertyId))].map((propertyId) =>
      assertPropertyEditable(userId, propertyId),
    ),
  );
  return prisma.expense.deleteMany({ where: { id: { in: expenseIds } } });
}

export async function listRecentCategories(userId: string, propertyId?: string) {
  return prisma.expense.findMany({
    where: { property: { ownerId: userId }, propertyId },
    distinct: ["categoryId"],
    select: { category: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}

export async function confirmPendingExpense(
  userId: string,
  expenseId: string,
  paidOn = new Date(),
) {
  const expense = await getExpense(userId, expenseId);
  if (!expense) throw new Error("EXPENSE_NOT_FOUND");
  await assertPropertyEditable(userId, expense.propertyId);
  return prisma.expense.update({
    where: { id: expenseId },
    data: { status: "PAID", paidOn },
  });
}
