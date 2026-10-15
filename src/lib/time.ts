/** Timezone helpers. All instants are stored in UTC; input and display use the business timezone. */

function partsInZone(instant: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const part of fmt.formatToParts(instant)) if (part.type !== "literal") p[part.type] = Number(part.value);
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset of `timeZone` from UTC at `instant`, in milliseconds. */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const p = partsInZone(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:MM") in `timeZone` to a UTC Date. Returns null if invalid. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date | null {
  const d = DATE_RE.exec(date);
  const t = TIME_RE.exec(time);
  if (!d || !t) return null;
  const [y, m, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const naive = Date.UTC(y, m - 1, day, Number(t[1]), Number(t[2]));
  const check = new Date(Date.UTC(y, m - 1, day));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== day) return null;
  let guess = naive - zoneOffsetMs(new Date(naive), timeZone);
  guess = naive - zoneOffsetMs(new Date(guess), timeZone); // second pass handles DST transitions
  return new Date(guess);
}

/** "YYYY-MM-DD" of `instant` in `timeZone`. */
export function dateKeyInZone(instant: Date, timeZone: string): string {
  const p = partsInZone(instant, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function timeKeyInZone(instant: Date, timeZone: string): string {
  const p = partsInZone(instant, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Default search window: tomorrow 10:00 to the day after, in the business timezone. */
export function defaultWindow(timeZone: string, now = new Date()) {
  const today = dateKeyInZone(now, timeZone);
  return { pickupDate: addDaysToKey(today, 1), pickupTime: "10:00", returnDate: addDaysToKey(today, 2), returnTime: "10:00", today };
}
