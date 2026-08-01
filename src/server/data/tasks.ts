import { prisma } from "@/lib/prisma";
import { assertPropertyEditable } from "@/lib/entitlements";
import type { Prisma, TaskStatus } from "@/generated/prisma/client";

export type TaskFilters = { propertyId?: string; status?: TaskStatus };
export type TaskOrder = { id: string; sortOrder: number };

type TaskCreateData = Omit<
  Prisma.TaskUncheckedCreateInput,
  "id" | "propertyId"
>;
type TaskUpdateData = Omit<
  Prisma.TaskUncheckedUpdateInput,
  "id" | "propertyId"
>;

async function assertTaskReferences(
  userId: string,
  categoryId: string | null | undefined,
  contactId: string | null | undefined,
) {
  if (categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, OR: [{ isSystem: true }, { ownerId: userId }] },
      select: { id: true },
    });
    if (!category) throw new Error("CATEGORY_NOT_FOUND");
  }
  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ownerId: userId },
      select: { id: true },
    });
    if (!contact) throw new Error("CONTACT_NOT_FOUND");
  }
}

export async function listTasks(userId: string, filters: TaskFilters = {}) {
  return prisma.task.findMany({
    where: {
      propertyId: filters.propertyId,
      status: filters.status,
      property: { ownerId: userId },
    },
    include: {
      contact: true,
      expenses: { select: { amountCents: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { dueDate: "asc" }],
  });
}

export async function createTask(
  userId: string,
  propertyId: string,
  data: TaskCreateData,
) {
  await assertPropertyEditable(userId, propertyId);
  await assertTaskReferences(userId, data.categoryId, data.contactId);
  return prisma.task.create({ data: { ...data, propertyId } });
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: TaskUpdateData,
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, property: { ownerId: userId } },
    select: { propertyId: true },
  });
  if (!task) throw new Error("TASK_NOT_FOUND");
  await assertPropertyEditable(userId, task.propertyId);
  await assertTaskReferences(
    userId,
    typeof data.categoryId === "string" ? data.categoryId : undefined,
    typeof data.contactId === "string" ? data.contactId : undefined,
  );
  return prisma.task.update({ where: { id: taskId }, data });
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, property: { ownerId: userId } },
    select: { propertyId: true },
  });
  if (!task) throw new Error("TASK_NOT_FOUND");
  await assertPropertyEditable(userId, task.propertyId);
  return prisma.task.delete({ where: { id: taskId } });
}

export async function reorderTasks(userId: string, tasks: TaskOrder[]) {
  const ids = tasks.map((task) => task.id);
  const owned = await prisma.task.findMany({
    where: { id: { in: ids }, property: { ownerId: userId } },
    select: { id: true, propertyId: true },
  });
  if (owned.length !== ids.length) throw new Error("TASK_NOT_FOUND");
  await Promise.all(
    [...new Set(owned.map((task) => task.propertyId))].map((propertyId) =>
      assertPropertyEditable(userId, propertyId),
    ),
  );
  await prisma.$transaction(
    tasks.map((task) =>
      prisma.task.update({ where: { id: task.id }, data: { sortOrder: task.sortOrder } }),
    ),
  );
}
