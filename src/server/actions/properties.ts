"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/utils";
import {
  propertyInputSchema,
  propertyStatuses,
  type PropertyInput,
} from "@/lib/validators/property";
import { requireUser } from "@/server/auth";
import {
  archiveProperty,
  createProperty,
  updateProperty,
  updatePropertyStatus,
} from "@/server/data/properties";

function errorResult<T = void>(error: unknown): ActionResult<T> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
  };
}

function parseProperty(input: PropertyInput) {
  const parsed = propertyInputSchema.parse(input);
  return {
    ...parsed,
    purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
    soldDate: parsed.soldDate ? new Date(parsed.soldDate) : null,
  };
}

export async function createPropertyAction(
  input: PropertyInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const property = await createProperty(user.id, parseProperty(input));
    revalidatePath("/properties");
    return { ok: true, data: { id: property.id } };
  } catch (error) {
    return errorResult<{ id: string }>(error);
  }
}

export async function updatePropertyAction(
  propertyId: string,
  input: PropertyInput,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const id = z.string().uuid().parse(propertyId);
    await updateProperty(user.id, id, parseProperty(input));
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function archivePropertyAction(propertyId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const id = z.string().uuid().parse(propertyId);
    await archiveProperty(user.id, id);
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updatePropertyStatusAction(
  propertyId: string,
  status: (typeof propertyStatuses)[number],
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const id = z.string().uuid().parse(propertyId);
    await updatePropertyStatus(user.id, id, z.enum(propertyStatuses).parse(status));
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
