"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import {
  createContact,
  deleteContact,
  getContact,
  updateContact,
} from "@/server/data/contacts";

const tradeTypes = [
  "MASON",
  "ELECTRICIAN",
  "PLUMBER",
  "PAINTER",
  "CARPENTER",
  "GLAZIER",
  "ROOFER",
  "ARCHITECT",
  "ENGINEER",
  "LAWYER",
  "BROKER",
  "CLEANER",
  "MOVER",
  "GENERAL",
  "OTHER",
] as const;
const nullableString = z.string().trim().max(5_000).nullable().optional();
const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  trade: z.enum(tradeTypes).default("GENERAL"),
  companyName: nullableString,
  taxId: z.string().trim().max(50).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  whatsapp: z.string().trim().max(50).nullable().optional(),
  email: z.email().nullable().optional(),
  city: z.string().trim().max(200).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().length(2).default("BR"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isFavorite: z.boolean().default(false),
  notes: nullableString,
});
const contactUpdateSchema = contactSchema.partial().refine((value) => Object.keys(value).length > 0);

function errorResult(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
}

export async function createContactAction(
  input: z.input<typeof contactSchema>,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_CONTACT" };

  try {
    const user = await requireUser();
    await createContact(user.id, parsed.data);
    revalidatePath("/contacts");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateContactAction(
  contactId: string,
  input: z.input<typeof contactUpdateSchema>,
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(contactId).success) {
    return { ok: false, error: "INVALID_CONTACT" };
  }
  const parsed = contactUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_CONTACT" };

  try {
    const user = await requireUser();
    await updateContact(user.id, contactId, parsed.data);
    revalidatePath("/contacts");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteContactAction(contactId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(contactId).success) {
    return { ok: false, error: "INVALID_CONTACT" };
  }

  try {
    const user = await requireUser();
    await deleteContact(user.id, contactId);
    revalidatePath("/contacts");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function toggleContactFavoriteAction(contactId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(contactId).success) {
    return { ok: false, error: "INVALID_CONTACT" };
  }

  try {
    const user = await requireUser();
    const contact = await getContact(user.id, contactId);
    if (!contact) return { ok: false, error: "CONTACT_NOT_FOUND" };
    await updateContact(user.id, contactId, { isFavorite: !contact.isFavorite });
    revalidatePath("/contacts");
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
