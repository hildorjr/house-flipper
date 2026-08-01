"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { createTask, deleteTask, reorderTasks, updateTask } from "@/server/data/tasks";

const taskStatus = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);
const taskSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5_000).nullable().optional(),
  status: taskStatus.default("TODO"),
  plannedBudgetCents: z.number().int().min(0).nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
});

const updateTaskSchema = taskSchema.omit({ propertyId: true }).partial().refine(
  (value) => Object.keys(value).length > 0,
);

function errorResult(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
}

export async function createTaskAction(
  input: z.input<typeof taskSchema>,
): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_TASK" };

  try {
    const user = await requireUser();
    const { propertyId, ...data } = parsed.data;
    await createTask(user.id, propertyId, {
      ...data,
      completedAt: data.status === "DONE" ? new Date() : null,
    });
    revalidatePath(`/properties/${propertyId}/tasks`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateTaskAction(
  taskId: string,
  input: z.input<typeof updateTaskSchema>,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(taskId).success) {
    return { ok: false, error: "INVALID_TASK" };
  }
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_TASK" };

  try {
    const user = await requireUser();
    await updateTask(user.id, taskId, {
      ...parsed.data,
      completedAt:
        parsed.data.status === "DONE"
          ? new Date()
          : parsed.data.status
            ? null
            : undefined,
    });
    revalidatePath("/properties");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(taskId).success) {
    return { ok: false, error: "INVALID_TASK" };
  }

  try {
    const user = await requireUser();
    await deleteTask(user.id, taskId);
    revalidatePath("/properties");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function reorderTasksAction(
  input: Array<{ id: string; sortOrder: number }>,
): Promise<ActionResult> {
  const parsed = z
    .array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) }))
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_TASK" };

  try {
    const user = await requireUser();
    await reorderTasks(user.id, parsed.data);
    revalidatePath("/properties");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
