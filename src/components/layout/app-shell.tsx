"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, Calculator, Home, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UpgradeBanner } from "@/components/layout/upgrade-banner";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

type AppShellProps = {
  children: React.ReactNode;
  showUpgradeBanner: boolean;
};

const navigation: {
  href: "/properties" | "/calculator" | "/contacts" | "/settings";
  icon: LucideIcon;
  key: "properties" | "calculator" | "contacts" | "settings";
}[] = [
  { href: "/properties", icon: Home, key: "properties" },
  { href: "/calculator", icon: Calculator, key: "calculator" },
  { href: "/contacts", icon: Users, key: "contacts" },
  { href: "/settings", icon: Settings, key: "settings" },
];

export function AppShell({ children, showUpgradeBanner }: AppShellProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");

  return (
    <div className="min-h-dvh surface-glow md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <Link
          href="/properties"
          className="flex min-h-16 items-center gap-2.5 px-5 text-base font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </span>
          {tBrand("name")}
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navigation.map(({ href, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/85 transition-all duration-200 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                )}
              >
                <Icon className="size-4 opacity-90" />
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-2">
          <SignOutButton className="min-h-11 w-full rounded-xl px-3 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        </div>
        <p className="px-5 pb-5 text-xs leading-relaxed text-sidebar-foreground/70">
          {tBrand("tagline")}
        </p>
      </aside>

      <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {showUpgradeBanner && <UpgradeBanner />}
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background/95 px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        {navigation.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium text-muted-foreground transition-all duration-200 ease-out",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="size-5" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
