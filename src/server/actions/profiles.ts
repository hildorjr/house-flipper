"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getProfile, updateProfile } from "@/server/data/profiles";

const profileSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  locale: z.enum(["pt-BR", "en"]),
  currency: z.string().min(3).max(3),
});

export async function saveProfile(
  input: z.infer<typeof profileSchema>,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(input);
    await updateProfile(user.id, data);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to save profile",
    };
  }
}

export async function loadProfileAction() {
  const user = await requireUser();
  return getProfile(user.id);
}
