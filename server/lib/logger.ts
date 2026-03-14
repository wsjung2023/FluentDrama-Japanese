// Lightweight server logger wrappers for consistent operational logs.
export function logInfo(message: string, context?: Record<string, unknown>) {
  if (context) {
    console.log(`[INFO] ${message}`, context);
    return;
  }
  console.log(`[INFO] ${message}`);
}

export function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  if (context) {
    console.error(`[ERROR] ${message}`, { error, ...context });
    return;
  }
  console.error(`[ERROR] ${message}`, error);
}
