import { getVehicleBySlug } from "@/server/vehicles";
import { busyIntervals } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { json, serverError } from "@/server/http";
import { addDaysToKey, zonedToUtc } from "@/lib/time";

/** Returns the days in a month (business timezone) that are fully or partly unavailable. No customer data. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("vehicle") ?? "";
  const month = url.searchParams.get("month") ?? "";
  if (!/^[a-z0-9-]{1,100}$/.test(slug) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return json({ error: "Invalid request" }, 400);
  try {
    const s = await getSettings();
    const tz = s.regional.timezone;
    const v = await getVehicleBySlug(slug);
    if (!v) return json({ error: "Not found" }, 404);
    const first = `${month}-01`;
    const days: string[] = [];
    for (let d = first; d.startsWith(month); d = addDaysToKey(d, 1)) days.push(d);
    const from = zonedToUtc(first, "00:00", tz)!;
    const to = zonedToUtc(addDaysToKey(days[days.length - 1], 1), "00:00", tz)!;
    const intervals = v.isAvailable ? await busyIntervals(v.id, from, to) : [{ start: from, end: to }];
    const busy = days.filter((d) => {
      const ds = zonedToUtc(d, "00:00", tz)!.getTime();
      const de = zonedToUtc(addDaysToKey(d, 1), "00:00", tz)!.getTime();
      return intervals.some((i) => i.start.getTime() < de && i.end.getTime() > ds);
    });
    return json({ month, busy }, 200, { "Cache-Control": "private, max-age=30" });
  } catch (e) {
    return serverError("availability.failed", e);
  }
}
