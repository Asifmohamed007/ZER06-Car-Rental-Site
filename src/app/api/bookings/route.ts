import { bookingRequestSchema, fieldErrors } from "@/lib/validation";
import { createBooking } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { json, readJson, sameOrigin, serverError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";
import { logInfo } from "@/server/log";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const body = await readJson(req);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);
  try {
    const rl = await rateLimit(`booking:${clientIp()}`, 10, 3600);
    if (!rl.ok) return json({ error: "Too many booking attempts. Please try again later or contact us." }, 429, { "Retry-After": String(rl.retryAfter) });
    const r = await createBooking(parsed.data, await getSettings());
    if (!r.ok) return json({ error: r.error, fields: r.field ? { [r.field]: r.error } : undefined }, r.status);
    if (!r.duplicate) logInfo("booking.created", { reference: r.reference, status: r.status });
    return json({ reference: r.reference, status: r.status }, r.duplicate ? 200 : 201);
  } catch (e) {
    return serverError("booking.failed", e);
  }
}
