import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __zer06Sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.DATABASE_SSL === "true" ? "require" : false,
    transform: { undefined: null },
  });
}

/** Lazily created so builds and pages that don't touch the database don't need a connection. */
export function sql() {
  if (!globalThis.__zer06Sql) globalThis.__zer06Sql = createClient();
  return globalThis.__zer06Sql;
}

export class DatabaseUnavailableError extends Error {}

export function isDbConnectionError(e: unknown): boolean {
  const code = (e as { code?: string })?.code ?? "";
  return ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "CONNECT_TIMEOUT", "57P01", "53300"].includes(code) ||
    /DATABASE_URL is not set/.test(String((e as Error)?.message));
}
