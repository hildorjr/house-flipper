"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        "flex items-center gap-3 transition-colors disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      onClick={() =>
        startTransition(async () => {
          const result = await signOut();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          router.replace("/login");
          router.refresh();
        })
      }
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {t("signOut")}
    </button>
  );
}
