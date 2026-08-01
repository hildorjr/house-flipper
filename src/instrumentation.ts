import type { Instrumentation } from "next";

import { logError } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("@/env");
  serverEnv();
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  logError("Unhandled server error", {
    error,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
