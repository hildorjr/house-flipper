"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import {
  confirmPendingExpense,
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/server/data/expenses";

const statusSchema = z.enum(["PLANNED", "PENDING", "PAID"]);
const dateSchema = z.coerce.date();

const expenseSchema = z.object({
  propertyId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1).max(500),
  amountCents: z.number().int().positive(),
  incurredOn: dateSchema,
  status: statusSchema,
  paidOn: dateSchema.nullable().optional(),
  paymentMethod: z
    .enum(["PIX", "CARD", "BOLETO", "CASH", "TRANSFER", "FINANCED", "OTHER"])
    .nullable()
    .optional(),
  contactId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

const expenseUpdateSchema = expenseSchema
  .omit({ propertyId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0);

function errorResult(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function createExpenseAction(
  input: z.input<typeof expenseSchema>,
): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid expense" };

  try {
    const user = await requireUser();
    const { propertyId, status, paidOn, ...data } = parsed.data;
    await createExpense(user.id, propertyId, {
      ...data,
      status,
      paidOn: status === "PAID" ? (paidOn ?? data.incurredOn) : null,
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateExpenseAction(
  expenseId: string,
  input: z.input<typeof expenseUpdateSchema>,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(expenseId).success) {
    return { ok: false, error: "Invalid expense" };
  }
  const parsed = expenseUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid expense" };

  try {
    const user = await requireUser();
    await updateExpense(user.id, expenseId, parsed.data);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteExpenseAction(expenseId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(expenseId).success) {
    return { ok: false, error: "Invalid expense" };
  }

  try {
    const user = await requireUser();
    await deleteExpense(user.id, expenseId);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function confirmPendingExpenseAction(
  expenseId: string,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(expenseId).success) {
    return { ok: false, error: "Invalid expense" };
  }

  try {
    const user = await requireUser();
    await confirmPendingExpense(user.id, expenseId);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
