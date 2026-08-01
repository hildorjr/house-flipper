"use server";

import { ensureProfile } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { isMockThirdParty, MOCK_OTP_CODE } from "@/lib/mock/enabled";
import {
  clearMockSessionCookie,
  mockUserIdFromIdentity,
  setMockSessionCookie,
} from "@/lib/mock/auth";
import type { ActionResult } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+[1-9]\d{7,14}$/;
const tokenPattern = /^\d{6}$/;

function errorResult(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function sendEmailOtp(email: string): Promise<ActionResult> {
  if (!emailPattern.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  if (isMockThirdParty()) {
    return { ok: true, data: undefined };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    return error ? { ok: false, error: error.message } : { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<ActionResult> {
  if (!emailPattern.test(email) || !tokenPattern.test(token)) {
    return { ok: false, error: "Enter a valid email address and 6-digit code" };
  }

  if (isMockThirdParty()) {
    if (token !== MOCK_OTP_CODE && token !== "123456") {
      return { ok: false, error: `Use mock code ${MOCK_OTP_CODE}` };
    }
    try {
      const id = mockUserIdFromIdentity(email);
      await ensureProfile(id, email);
      await setMockSessionCookie({ id, email, phone: null });
      return { ok: true, data: undefined };
    } catch (error) {
      return errorResult(error);
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Unable to verify your code" };

    await ensureProfile(data.user.id, data.user.email ?? null);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function sendPhoneOtp(phone: string): Promise<ActionResult> {
  if (process.env.FEATURE_PHONE_OTP !== "true") {
    return { ok: false, error: "Phone authentication is unavailable" };
  }
  if (!phonePattern.test(phone)) {
    return { ok: false, error: "Enter a valid phone number with country code" };
  }

  if (isMockThirdParty()) {
    return { ok: true, data: undefined };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return error ? { ok: false, error: error.message } : { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<ActionResult> {
  if (process.env.FEATURE_PHONE_OTP !== "true") {
    return { ok: false, error: "Phone authentication is unavailable" };
  }
  if (!phonePattern.test(phone) || !tokenPattern.test(token)) {
    return { ok: false, error: "Enter a valid phone number and 6-digit code" };
  }

  if (isMockThirdParty()) {
    if (token !== MOCK_OTP_CODE && token !== "123456") {
      return { ok: false, error: `Use mock code ${MOCK_OTP_CODE}` };
    }
    try {
      const id = mockUserIdFromIdentity(phone);
      await ensureProfile(id, null);
      await setMockSessionCookie({ id, email: null, phone });
      return { ok: true, data: undefined };
    } catch (error) {
      return errorResult(error);
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Unable to verify your code" };

    await ensureProfile(data.user.id, data.user.email ?? null);
    return { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}

export async function signOut(): Promise<ActionResult> {
  try {
    if (isMockThirdParty()) {
      await clearMockSessionCookie();
      return { ok: true, data: undefined };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    return error ? { ok: false, error: error.message } : { ok: true, data: undefined };
  } catch (error) {
    return errorResult(error);
  }
}
