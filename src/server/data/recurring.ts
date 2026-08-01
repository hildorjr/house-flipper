import { prisma } from "@/lib/prisma";
import { assertPropertyEditable } from "@/lib/entitlements";
import type { Prisma } from "@/generated/prisma/client";

type RuleCreateData = Omit<
  Prisma.RecurringExpenseRuleUncheckedCreateInput,
  "id" | "propertyId" | "generatedThrough"
>;
type RuleUpdateData = Omit<
  Prisma.RecurringExpenseRuleUncheckedUpdateInput,
  "id" | "propertyId"
>;

const frequencyMonths = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
} as const;

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(month: Date, count: number) {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + count, 1));
}

function monthsBetween(from: Date, to: Date) {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

function dueDate(month: Date, dayOfMonth: number) {
  const lastDay = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(dayOfMonth, lastDay)),
  );
}

async function assertCategoryAccess(userId: string, categoryId: string) {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, OR: [{ isSystem: true }, { ownerId: userId }] },
    select: { id: true },
  });
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
}

export async function listRules(userId: string, propertyId?: string) {
  return prisma.recurringExpenseRule.findMany({
    where: { propertyId, property: { ownerId: userId } },
    include: { category: true },
    orderBy: { startDate: "desc" },
  });
}

export async function createRule(
  userId: string,
  propertyId: string,
  data: RuleCreateData,
) {
  await assertPropertyEditable(userId, propertyId);
  await assertCategoryAccess(userId, data.categoryId);
  return prisma.recurringExpenseRule.create({ data: { ...data, propertyId } });
}

export async function updateRule(
  userId: string,
  ruleId: string,
  data: RuleUpdateData,
) {
  const rule = await prisma.recurringExpenseRule.findFirst({
    where: { id: ruleId, property: { ownerId: userId } },
    select: { propertyId: true },
  });
  if (!rule) throw new Error("RECURRING_RULE_NOT_FOUND");
  await assertPropertyEditable(userId, rule.propertyId);
  if (typeof data.categoryId === "string") {
    await assertCategoryAccess(userId, data.categoryId);
  }
  return prisma.recurringExpenseRule.update({ where: { id: ruleId }, data });
}

export async function deleteRule(userId: string, ruleId: string) {
  const rule = await prisma.recurringExpenseRule.findFirst({
    where: { id: ruleId, property: { ownerId: userId } },
    select: { propertyId: true },
  });
  if (!rule) throw new Error("RECURRING_RULE_NOT_FOUND");
  await assertPropertyEditable(userId, rule.propertyId);
  return prisma.recurringExpenseRule.delete({ where: { id: ruleId } });
}

async function generateExpenses(
  rules: Awaited<ReturnType<typeof prisma.recurringExpenseRule.findMany>>,
  userId?: string,
) {
  const today = monthStart(new Date());
  let created = 0;
  for (const rule of rules) {
    if (userId) await assertPropertyEditable(userId, rule.propertyId);
    const start = monthStart(rule.startDate);
    const end = rule.endDate ? monthStart(rule.endDate) : today;
    const through = end < today ? end : today;
    const resume = rule.generatedThrough
      ? addMonths(monthStart(rule.generatedThrough), 1)
      : start;
    const from = resume > start ? resume : start;
    if (from > through) continue;

    const interval = frequencyMonths[rule.frequency];
    const expenses: Prisma.ExpenseCreateManyInput[] = [];

    for (let month = from; month <= through; month = addMonths(month, 1)) {
      if (monthsBetween(start, month) % interval !== 0) continue;
      expenses.push({
        propertyId: rule.propertyId,
        categoryId: rule.categoryId,
        recurringRuleId: rule.id,
        description: rule.description,
        amountCents: rule.estimatedAmountCents,
        incurredOn: dueDate(month, rule.dayOfMonth),
        status: "PENDING",
        periodKey: `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const inserted = expenses.length
        ? await tx.expense.createMany({ data: expenses, skipDuplicates: true })
        : { count: 0 };
      await tx.recurringExpenseRule.update({
        where: { id: rule.id },
        data: { generatedThrough: through },
      });
      return inserted.count;
    });
    created += result;
  }
  return created;
}

export async function generatePendingExpenses(userId: string, propertyId?: string) {
  const rules = await prisma.recurringExpenseRule.findMany({
    where: {
      propertyId,
      isActive: true,
      autoGenerate: true,
      property: { ownerId: userId },
    },
  });
  return generateExpenses(rules, userId);
}

export async function generateAllPendingExpenses() {
  const rules = await prisma.recurringExpenseRule.findMany({
    where: { isActive: true, autoGenerate: true },
  });
  return generateExpenses(rules);
}
