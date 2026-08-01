import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { logError } from "@/lib/logger";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function errorResult<T = void>(
  error: unknown,
  context: Record<string, unknown> = {},
): ActionResult<T> {
  logError("Server action failed", { ...context, error });
  return {
    ok: false,
    error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
  };
}
