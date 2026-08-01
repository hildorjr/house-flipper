"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import {
  createLoan,
  deleteLoan,
  markInstallmentPaid,
  unmarkInstallmentPaid,
} from "@/server/data/loans";

const loanSchema = z.object({
  propertyId: z.string().uuid(),
  lender: z.string().trim().min(1).max(200),
  principalCents: z.number().int().positive(),
  annualRateBps: z.number().int().min(0).max(100_000),
  termMonths: z.number().int().min(1).max(600),
  system: z.enum(["SAC", "PRICE"]),
  firstDueDate: z.string().date(),
  monthlyInsuranceCents: z.number().int().min(0).default(0),
  monthlyAdminFeeCents: z.number().int().min(0).default(0),
  originationFeeCents: z.number().int().min(0).default(0),
});

function errorResult(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
}

export async function createLoanAction(
  input: z.input<typeof loanSchema>,
): Promise<ActionResult> {
  const parsed = loanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_LOAN" };

  try {
    const user = await requireUser();
    const { propertyId, ...data } = parsed.data;
    await createLoan(user.id, propertyId, data);
    revalidatePath(`/properties/${propertyId}/financing`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteLoanAction(loanId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(loanId).success) {
    return { ok: false, error: "INVALID_LOAN" };
  }

  try {
    const user = await requireUser();
    await deleteLoan(user.id, loanId);
    revalidatePath("/properties");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

async function setInstallmentPayment(
  installmentId: string,
  paid: boolean,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(installmentId).success) {
    return { ok: false, error: "INVALID_INSTALLMENT" };
  }

  try {
    const user = await requireUser();
    if (paid) {
      await markInstallmentPaid(user.id, installmentId);
    } else {
      await unmarkInstallmentPaid(user.id, installmentId);
    }
    revalidatePath("/properties");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function markInstallmentPaidAction(installmentId: string) {
  return setInstallmentPayment(installmentId, true);
}

export async function unmarkInstallmentPaidAction(installmentId: string) {
  return setInstallmentPayment(installmentId, false);
}
