import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { getMockSessionFromCookies } from "@/lib/mock/auth";

export async function getSessionUser() {
  if (isMockThirdParty()) {
    const session = await getMockSessionFromCookies();
    if (!session) return null;
    return { id: session.id, email: session.email };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub as string,
    email: (claims.email as string | undefined) ?? null,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }
  return user;
}

export async function ensureProfile(userId: string, email: string | null) {
  return prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email,
      subscription: { create: {} },
    },
    update: {
      email: email ?? undefined,
    },
    include: { subscription: true },
  });
}
