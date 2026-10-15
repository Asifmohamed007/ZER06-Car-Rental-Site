import "server-only";
import { NextResponse } from "next/server";
import { logError } from "./log";
import { isDbConnectionError } from "./db";

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Reads a JSON body with a size cap. Returns null for malformed or oversized bodies. */
export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown | null> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/** Rejects cross-site browser POSTs. Same-origin fetches and non-browser tools without Origin pass. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host")); } catch { return false; }
}

export function serverError(event: string, e: unknown) {
  logError(event, e);
  if (isDbConnectionError(e)) return json({ error: "Bookings are temporarily unavailable. Please try again in a few minutes or contact us directly." }, 503);
  return json({ error: "Something went wrong on our side. Please try again, or contact us directly." }, 500);
}
