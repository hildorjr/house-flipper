"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

type PropertyTabsProps = {
  basePath: string;
  tabs: readonly (readonly [string, string])[];
};

export function PropertyTabs({ basePath, tabs }: PropertyTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:rounded-2xl sm:border sm:bg-card sm:p-1.5 sm:px-1.5 sm:shadow-sm">
      {tabs.map(([suffix, label]) => {
        const href = `${basePath}${suffix}`;
        const active = pathname === href;

        return (
          <Link
            key={suffix}
            href={href}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
