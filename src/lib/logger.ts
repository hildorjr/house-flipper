type LogContext = Record<string, unknown> & { error?: unknown };

function describeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

function emit(level: "error" | "warn", message: string, { error, ...context }: LogContext) {
  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    ...(error === undefined ? {} : { error: describeError(error) }),
  });

  if (level === "error") console.error(line);
  else console.warn(line);
}

export function logError(message: string, context: LogContext = {}) {
  emit("error", message, context);
}

export function logWarn(message: string, context: LogContext = {}) {
  emit("warn", message, context);
}
