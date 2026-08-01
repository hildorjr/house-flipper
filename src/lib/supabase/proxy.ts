import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { isMockThirdParty } from "@/lib/mock/enabled";
import { getMockSessionFromRequest } from "@/lib/mock/auth";

function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    return {
      locale: maybeLocale,
      basePath: `/${segments.slice(2).join("/")}` || "/",
    };
  }
  return { locale: routing.defaultLocale, basePath: pathname };
}

function guardRoutes(
  request: NextRequest,
  response: NextResponse,
  user: unknown,
) {
  const { locale, basePath } = stripLocale(request.nextUrl.pathname);
  const isAuthRoute =
    basePath.startsWith("/login") ||
    basePath.startsWith("/verify") ||
    basePath.startsWith("/auth");
  const isPublicRoute = basePath === "/" || isAuthRoute;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/properties`;
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  if (isMockThirdParty()) {
    return guardRoutes(request, response, getMockSessionFromRequest(request));
  }

  let supabaseResponse = response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
          response.cookies.getAll().forEach((cookie) => {
            if (!supabaseResponse.cookies.get(cookie.name)) {
              supabaseResponse.cookies.set(cookie);
            }
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  return guardRoutes(request, supabaseResponse, data?.claims);
}
