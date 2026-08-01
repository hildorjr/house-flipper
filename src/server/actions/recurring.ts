"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import {
  createRule,
  deleteRule,
  generatePendingExpenses,
  updateRule,
} from "@/server/data/recurring";

const ruleSchema = z.object({
  propertyId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1).max(500),
  estimatedAmountCents: z.number().int().positive(),
  frequency: z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]),
  dayOfMonth: z.number().int().min(1).max(31),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  autoGenerate: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const ruleUpdateSchema = ruleSchema
  .omit({ propertyId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0);

function errorResult<T = void>(error: unknown): ActionResult<T> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function createRecurringRuleAction(
  input: z.input<typeof ruleSchema>,
): Promise<ActionResult> {
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid recurring expense" };

  try {
    const user = await requireUser();
    const { propertyId, ...data } = parsed.data;
    await createRule(user.id, propertyId, data);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateRecurringRuleAction(
  ruleId: string,
  input: z.input<typeof ruleUpdateSchema>,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(ruleId).success) {
    return { ok: false, error: "Invalid recurring expense" };
  }
  const parsed = ruleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid recurring expense" };

  try {
    const user = await requireUser();
    await updateRule(user.id, ruleId, parsed.data);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteRecurringRuleAction(ruleId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(ruleId).success) {
    return { ok: false, error: "Invalid recurring expense" };
  }

  try {
    const user = await requireUser();
    await deleteRule(user.id, ruleId);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function generateRecurringExpensesAction(
  propertyId: string,
): Promise<ActionResult<number>> {
  if (!z.string().uuid().safeParse(propertyId).success) {
    return { ok: false, error: "Invalid property" };
  }

  try {
    const user = await requireUser();
    const count = await generatePendingExpenses(user.id, propertyId);
    return { ok: true, data: count };
  } catch (error) {
    return errorResult<number>(error);
  }
}
