import { enquirySchema, fieldErrors } from "@/lib/validation";
import { createEnquiry } from "@/server/enquiries";
import { json, readJson, sameOrigin, serverError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const parsed = enquirySchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);
  try {
    const rl = await rateLimit(`enquiry:${clientIp()}`, 5, 3600);
    if (!rl.ok) return json({ error: "You've sent several messages already. Please wait a while or contact us by phone." }, 429);
    const { website: _hp, ...e } = parsed.data;
    await createEnquiry(e);
    return json({ ok: true }, 201);
  } catch (e) {
    return serverError("enquiry.failed", e);
  }
}
