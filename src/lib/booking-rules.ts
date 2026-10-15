import { billableDays } from "./pricing";
import { zonedToUtc } from "./time";

export type WindowPolicy = {
  graceMinutes: number;
  minDays: number;
  maxDays: number;
  minLeadHours: number;
  maxAdvanceDays: number;
};

export type WindowResult =
  | { ok: true; pickupAt: Date; returnAt: Date }
  | { ok: false; field: string; error: string };

/** Shared by the browser (instant feedback) and the server (authoritative check). */
export function checkRentalWindow(
  input: { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string },
  timeZone: string,
  policy: WindowPolicy,
  now: Date = new Date(),
): WindowResult {
  const pickupAt = zonedToUtc(input.pickupDate, input.pickupTime, timeZone);
  if (!pickupAt) return { ok: false, field: "pickupDate", error: "Choose a valid pickup date and time." };
  const returnAt = zonedToUtc(input.returnDate, input.returnTime, timeZone);
  if (!returnAt) return { ok: false, field: "returnDate", error: "Choose a valid return date and time." };
  if (returnAt <= pickupAt) return { ok: false, field: "returnDate", error: "Return must be after pickup." };
  const earliest = now.getTime() + policy.minLeadHours * 3_600_000;
  if (pickupAt.getTime() < earliest) {
    return {
      ok: false, field: "pickupDate",
      error: policy.minLeadHours > 0 ? `Pickup must be at least ${policy.minLeadHours} hour${policy.minLeadHours === 1 ? "" : "s"} from now.` : "Pickup can't be in the past.",
    };
  }
  if (pickupAt.getTime() > now.getTime() + policy.maxAdvanceDays * 86_400_000) {
    return { ok: false, field: "pickupDate", error: `Bookings open up to ${policy.maxAdvanceDays} days ahead.` };
  }
  if (billableDays(pickupAt, returnAt, policy) > policy.maxDays) {
    return { ok: false, field: "returnDate", error: `Online bookings are limited to ${policy.maxDays} days. Contact us for longer rentals.` };
  }
  return { ok: true, pickupAt, returnAt };
}
