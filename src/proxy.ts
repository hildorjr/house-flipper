import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
