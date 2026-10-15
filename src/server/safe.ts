import "server-only";
import { logError } from "./log";

/** Runs a read and returns a fallback (plus a flag) instead of crashing the page if the database is unreachable. */
export async function safeRead<T>(event: string, fn: () => Promise<T>, fallback: T): Promise<{ data: T; failed: boolean }> {
  try {
    return { data: await fn(), failed: false };
  } catch (e) {
    logError(event, e);
    return { data: fallback, failed: true };
  }
}
