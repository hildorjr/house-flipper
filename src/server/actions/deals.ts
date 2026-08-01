"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/utils";
import { dealInputSchema, type DealInput } from "@/lib/validators/deal";
import { requireUser } from "@/server/auth";
import {
  convertDealToProperty,
  createDealAnalysis,
  updateDealAnalysis,
} from "@/server/data/deals";

function errorResult<T = void>(error: unknown): ActionResult<T> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
  };
}

export async function createDealAnalysisAction(
  input: DealInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const analysis = await createDealAnalysis(
      user.id,
      dealInputSchema.parse(input),
    );
    revalidatePath("/calculator");
    return { ok: true, data: { id: analysis.id } };
  } catch (error) {
    return errorResult<{ id: string }>(error);
  }
}

export async function updateDealAnalysisAction(
  analysisId: string,
  input: DealInput,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const id = z.string().uuid().parse(analysisId);
    await updateDealAnalysis(user.id, id, dealInputSchema.parse(input));
    revalidatePath("/calculator");
    revalidatePath(`/calculator/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function convertDealToPropertyAction(
  analysisId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const id = z.string().uuid().parse(analysisId);
    const property = await convertDealToProperty(user.id, id);
    revalidatePath("/calculator");
    revalidatePath(`/calculator/${id}`);
    revalidatePath("/properties");
    return { ok: true, data: { id: property.id } };
  } catch (error) {
    return errorResult<{ id: string }>(error);
  }
}
