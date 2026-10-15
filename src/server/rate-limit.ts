import "server-only";
import { sql } from "./db";

/** Fixed-window rate limiter stored in Postgres, so it works across serverless instances. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; retryAfter: number }> {
  const rows = await sql()<{ count: number; window_start: Date }[]>`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start`;
  const { count, window_start } = rows[0];
  const retryAfter = Math.max(1, Math.ceil((window_start.getTime() + windowSeconds * 1000 - Date.now()) / 1000));
  return { ok: count <= limit, retryAfter };
}

export async function clearRateLimit(key: string) {
  await sql()`DELETE FROM rate_limits WHERE key = ${key}`;
}
