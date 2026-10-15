import { quoteRequestSchema, fieldErrors } from "@/lib/validation";
import { quoteBooking } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { json, readJson, sameOrigin, serverError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const body = await readJson(req);
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);
  try {
    const rl = await rateLimit(`quote:${clientIp()}`, 120, 600);
    if (!rl.ok) return json({ error: "Too many requests. Wait a moment and try again." }, 429, { "Retry-After": String(rl.retryAfter) });
    const r = await quoteBooking(parsed.data, await getSettings());
    if (!r.ok) return json({ error: r.error, fields: r.field ? { [r.field]: r.error } : undefined }, r.status);
    return json({ available: r.available, reason: r.unavailableReason, quote: r.quote });
  } catch (e) {
    return serverError("quote.failed", e);
  }
}
