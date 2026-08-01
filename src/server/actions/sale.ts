"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/utils";
import { saleInputSchema, type SaleInput } from "@/lib/validators/sale";
import { requireUser } from "@/server/auth";
import { updateProperty } from "@/server/data/properties";

function errorResult(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
  };
}

async function saveSale(propertyId: string, input: SaleInput, sold: boolean) {
  const user = await requireUser();
  const id = z.string().uuid().parse(propertyId);
  const value = saleInputSchema.parse(input);
  if (sold && value.soldPriceCents == null) throw new Error("SOLD_PRICE_REQUIRED");
  await updateProperty(user.id, id, {
    ...value,
    soldDate: value.soldDate ? new Date(value.soldDate) : null,
    ...(sold ? { status: "SOLD" } : {}),
  });
  revalidatePath(`/properties/${id}`);
  revalidatePath(`/properties/${id}/sale`);
  revalidatePath("/properties");
}

export async function updateSaleAction(
  propertyId: string,
  input: SaleInput,
): Promise<ActionResult> {
  try {
    await saveSale(propertyId, input, false);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function markPropertySoldAction(
  propertyId: string,
  input: SaleInput,
): Promise<ActionResult> {
  try {
    await saveSale(propertyId, input, true);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
