/** Minimal structured logger. Never pass customer names, phone numbers, emails or tokens here. */
export function logError(event: string, err: unknown, meta: Record<string, string | number | boolean> = {}) {
  const e = err as { message?: string; code?: string };
  console.error(JSON.stringify({ level: "error", event, code: e?.code, message: e?.message, ...meta, at: new Date().toISOString() }));
}
export function logInfo(event: string, meta: Record<string, string | number | boolean> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...meta, at: new Date().toISOString() }));
}
