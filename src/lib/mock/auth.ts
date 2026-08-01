import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const MOCK_SESSION_COOKIE = "hf_mock_session";

export type MockSession = {
  id: string;
  email: string | null;
  phone: string | null;
};

export function mockUserIdFromIdentity(identity: string) {
  const hash = createHash("sha256")
    .update(`house-flipper-mock:${identity.trim().toLowerCase()}`)
    .digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

export function encodeMockSession(session: MockSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeMockSession(value: string | undefined): MockSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as MockSession;
    if (!parsed?.id || typeof parsed.id !== "string") return null;
    return {
      id: parsed.id,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
    };
  } catch {
    return null;
  }
}

export function mockSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function getMockSessionFromCookies() {
  const store = await cookies();
  return decodeMockSession(store.get(MOCK_SESSION_COOKIE)?.value);
}

export async function setMockSessionCookie(session: MockSession) {
  const store = await cookies();
  store.set(
    MOCK_SESSION_COOKIE,
    encodeMockSession(session),
    mockSessionCookieOptions(),
  );
}

export async function clearMockSessionCookie() {
  const store = await cookies();
  store.delete(MOCK_SESSION_COOKIE);
}

export function getMockSessionFromRequest(request: NextRequest) {
  return decodeMockSession(request.cookies.get(MOCK_SESSION_COOKIE)?.value);
}

export function writeMockSessionCookie(
  response: NextResponse,
  session: MockSession | null,
) {
  if (!session) {
    response.cookies.delete(MOCK_SESSION_COOKIE);
    return;
  }
  response.cookies.set(
    MOCK_SESSION_COOKIE,
    encodeMockSession(session),
    mockSessionCookieOptions(),
  );
}
