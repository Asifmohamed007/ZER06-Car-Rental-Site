import "server-only";
import { createHash } from "crypto";
import type { Sql } from "postgres";
import { sql } from "./db";
import { computeQuote, type Quote } from "@/lib/pricing";
import { checkRentalWindow } from "@/lib/booking-rules";
import { generateReference } from "@/lib/reference";
import type { BookingRequest, QuoteRequest } from "@/lib/validation";
import type { SiteSettings } from "@/lib/settings-schema";

export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export type QuoteResult =
  | { ok: true; quote: Quote; pickupAt: Date; returnAt: Date; vehicle: { id: number; name: string; dailyRate: number }; available: boolean; unavailableReason?: string }
  | { ok: false; status: 400 | 404; field?: string; error: string };

type VehicleRow = { id: string; brand: string; model: string; year: number; daily_rate: number; deposit: number; is_available: boolean };

type Db = Sql<{}>;

async function conflicts(db: Db, vehicleId: number, pickupAt: Date, returnAt: Date): Promise<string | null> {
  const [b] = await db<{ n: string }[]>`
    SELECT count(*) AS n FROM bookings
    WHERE vehicle_id = ${vehicleId} AND status IN ('pending','confirmed')
      AND tstzrange(pickup_at, return_at, '[)') && tstzrange(${pickupAt}, ${returnAt}, '[)')`;
  if (Number(b.n) > 0) return "This car is already booked for some of those dates.";
  const [k] = await db<{ n: string }[]>`
    SELECT count(*) AS n FROM blocked_periods
    WHERE vehicle_id = ${vehicleId} AND tstzrange(starts_at, ends_at, '[)') && tstzrange(${pickupAt}, ${returnAt}, '[)')`;
  if (Number(k.n) > 0) return "This car isn't available for some of those dates.";
  return null;
}

function locationFees(settings: SiteSettings, pickupId: string, returnId: string) {
  const p = settings.booking.locations.find((l) => l.id === pickupId);
  const r = settings.booking.locations.find((l) => l.id === returnId);
  return { p, r };
}

/** Server-side price and availability. Prices always come from the database and settings, never the client. */
export async function quoteBooking(input: QuoteRequest, settings: SiteSettings, db: Db = sql(), now = new Date()): Promise<QuoteResult> {
  const window = checkRentalWindow(input, settings.regional.timezone, settings.booking, now);
  if (!window.ok) return { ok: false, status: 400, field: window.field, error: window.error };
  const { p, r } = locationFees(settings, input.pickupLocation, input.returnLocation);
  if (!p) return { ok: false, status: 400, field: "pickupLocation", error: "Choose a pickup location from the list." };
  if (!r) return { ok: false, status: 400, field: "returnLocation", error: "Choose a return location from the list." };
  const [v] = await db<VehicleRow[]>`
    SELECT id, brand, model, year, daily_rate, deposit, is_available FROM vehicles WHERE slug = ${input.vehicleSlug} AND archived_at IS NULL`;
  if (!v) return { ok: false, status: 404, error: "This car is no longer listed." };
  const quote = computeQuote(
    {
      pickupAt: window.pickupAt, returnAt: window.returnAt, dailyRate: v.daily_rate, deposit: v.deposit,
      pickupFee: p.fee, returnFee: r.fee, pickupLocationName: p.name, returnLocationName: r.name,
      additionalDriver: input.additionalDriver,
    },
    settings.booking,
  );
  let reason: string | null = v.is_available ? null : "This car isn't taking bookings at the moment.";
  if (!reason) reason = await conflicts(db, Number(v.id), window.pickupAt, window.returnAt);
  return {
    ok: true, quote, pickupAt: window.pickupAt, returnAt: window.returnAt,
    vehicle: { id: Number(v.id), name: `${v.year} ${v.brand} ${v.model}`, dailyRate: v.daily_rate },
    available: !reason, unavailableReason: reason ?? undefined,
  };
}

export type CreateBookingResult =
  | { ok: true; reference: string; status: string; duplicate: boolean }
  | { ok: false; status: 400 | 404 | 409; field?: string; error: string };

/**
 * Creates a booking inside a transaction:
 * 1. Locks the vehicle row (SELECT ... FOR UPDATE) so concurrent requests for the same car run one at a time.
 * 2. Re-checks availability and recomputes the price from trusted data.
 * 3. Inserts the booking. A Postgres exclusion constraint is the final guarantee against overlaps.
 * Re-sending the same idempotency key returns the original booking instead of creating a duplicate.
 */
export async function createBooking(input: BookingRequest, settings: SiteSettings, now = new Date()): Promise<CreateBookingResult> {
  const keyHash = hashKey(input.idempotencyKey);
  const existing = await sql()<{ reference: string; status: string }[]>`SELECT reference, status FROM bookings WHERE idempotency_key = ${keyHash}`;
  if (existing[0]) return { ok: true, reference: existing[0].reference, status: existing[0].status, duplicate: true };

  if (input.paymentMethod === "pay_on_arrival" && !settings.payments.payOnArrival) {
    return { ok: false, status: 400, field: "paymentMethod", error: "Choose an available payment option." };
  }
  if (input.paymentMethod === "arrange_with_team" && !settings.payments.arrangeWithTeam) {
    return { ok: false, status: 400, field: "paymentMethod", error: "Choose an available payment option." };
  }
  if (input.driverAge < settings.policies.minDriverAge) {
    return { ok: false, status: 400, field: "driverAge", error: `Drivers must be at least ${settings.policies.minDriverAge}.` };
  }

  try {
    return await sql().begin(async (tx) => {
      const locked = await tx<{ id: string }[]>`
        SELECT id FROM vehicles WHERE slug = ${input.vehicleSlug} AND archived_at IS NULL FOR UPDATE`;
      if (!locked[0]) return { ok: false, status: 404, error: "This car is no longer listed." } as const;

      const q = await quoteBooking(input, settings, tx, now);
      if (!q.ok) return q;
      if (!q.available) return { ok: false, status: 409, field: "pickupDate", error: q.unavailableReason ?? "This car isn't available for those dates." } as const;

      const { p, r } = locationFees(settings, input.pickupLocation, input.returnLocation);
      const status = settings.booking.requireApproval ? "pending" : "confirmed";
      for (let attempt = 0; attempt < 5; attempt++) {
        const reference = generateReference();
        const rows = await tx<{ reference: string }[]>`
          INSERT INTO bookings (
            reference, idempotency_key, vehicle_id, customer_name, customer_phone, customer_email, driver_age, notes,
            pickup_at, return_at, pickup_location, return_location, additional_driver, billable_days, daily_rate,
            price_breakdown, total, deposit, status, payment_method, payment_status
          ) VALUES (
            ${reference}, ${keyHash}, ${q.vehicle.id}, ${input.customerName}, ${input.customerPhone}, ${input.customerEmail},
            ${input.driverAge}, ${input.notes}, ${q.pickupAt}, ${q.returnAt}, ${p!.name}, ${r!.name}, ${input.additionalDriver},
            ${q.quote.billableDays}, ${q.vehicle.dailyRate}, ${tx.json(q.quote as never)}, ${q.quote.total}, ${q.quote.deposit},
            ${status}, ${input.paymentMethod}, 'unpaid'
          ) ON CONFLICT (reference) DO NOTHING RETURNING reference`;
        if (rows[0]) return { ok: true, reference: rows[0].reference, status, duplicate: false } as const;
      }
      throw new Error("Could not generate a unique booking reference");
    });
  } catch (e) {
    const code = (e as { code?: string; constraint_name?: string }).code;
    if (code === "23P01") return { ok: false, status: 409, field: "pickupDate", error: "This car was just booked for those dates. Choose different dates." };
    if (code === "23505" && (e as { constraint_name?: string }).constraint_name === "bookings_idempotency_key_key") {
      const again = await sql()<{ reference: string; status: string }[]>`SELECT reference, status FROM bookings WHERE idempotency_key = ${keyHash}`;
      if (again[0]) return { ok: true, reference: again[0].reference, status: again[0].status, duplicate: true };
    }
    throw e;
  }
}

export type BookingView = {
  id: number; reference: string; status: string; vehicleName: string; vehicleSlug: string;
  customerName: string; customerPhone: string; customerEmail: string; driverAge: number | null; notes: string;
  pickupAt: Date; returnAt: Date; pickupLocation: string; returnLocation: string; additionalDriver: boolean;
  billableDays: number; dailyRate: number; breakdown: Quote; total: number; deposit: number;
  paymentMethod: string; paymentStatus: string; adminNotes: string; createdAt: Date;
};

type BookingRow = {
  id: string; reference: string; status: string; brand: string; model: string; year: number; slug: string;
  customer_name: string; customer_phone: string; customer_email: string; driver_age: number | null; notes: string;
  pickup_at: Date; return_at: Date; pickup_location: string; return_location: string; additional_driver: boolean;
  billable_days: number; daily_rate: number; price_breakdown: Quote; total: number; deposit: number;
  payment_method: string; payment_status: string; admin_notes: string; created_at: Date;
};

const mapBooking = (r: BookingRow): BookingView => ({
  id: Number(r.id), reference: r.reference, status: r.status, vehicleName: `${r.year} ${r.brand} ${r.model}`, vehicleSlug: r.slug,
  customerName: r.customer_name, customerPhone: r.customer_phone, customerEmail: r.customer_email, driverAge: r.driver_age,
  notes: r.notes, pickupAt: r.pickup_at, returnAt: r.return_at, pickupLocation: r.pickup_location, returnLocation: r.return_location,
  additionalDriver: r.additional_driver, billableDays: r.billable_days, dailyRate: r.daily_rate, breakdown: r.price_breakdown,
  total: r.total, deposit: r.deposit, paymentMethod: r.payment_method, paymentStatus: r.payment_status, adminNotes: r.admin_notes,
  createdAt: r.created_at,
});

/** Customer view: requires the private token from their confirmation link. */
export async function getBookingForCustomer(reference: string, token: string): Promise<BookingView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const rows = await sql()<BookingRow[]>`
    SELECT b.*, v.brand, v.model, v.year, v.slug FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id
    WHERE b.reference = ${reference} AND b.idempotency_key = ${hashKey(token)}`;
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function getBookingById(id: number): Promise<BookingView | null> {
  const rows = await sql()<BookingRow[]>`
    SELECT b.*, v.brand, v.model, v.year, v.slug FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.id = ${id}`;
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function listBookings(f: { status?: string; q?: string; limit?: number }): Promise<BookingView[]> {
  const db = sql();
  const q = f.q?.trim().slice(0, 80);
  const like = q ? `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  const rows = await db<BookingRow[]>`
    SELECT b.*, v.brand, v.model, v.year, v.slug FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id
    WHERE TRUE
      ${f.status ? db`AND b.status = ${f.status}::booking_status` : db``}
      ${like ? db`AND (b.reference ILIKE ${like} OR b.customer_name ILIKE ${like} OR b.customer_email ILIKE ${like} OR b.customer_phone ILIKE ${like} OR v.brand ILIKE ${like} OR v.model ILIKE ${like})` : db``}
    ORDER BY b.created_at DESC LIMIT ${Math.min(f.limit ?? 200, 500)}`;
  return rows.map(mapBooking);
}

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export async function changeBookingStatus(id: number, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    return await sql().begin(async (tx) => {
      const [b] = await tx<{ status: string }[]>`SELECT status FROM bookings WHERE id = ${id} FOR UPDATE`;
      if (!b) return { ok: false, error: "Booking not found." } as const;
      if (!ALLOWED_TRANSITIONS[b.status]?.includes(next)) {
        return { ok: false, error: `A ${b.status} booking can't be changed to ${next}.` } as const;
      }
      await tx`UPDATE bookings SET status = ${next}::booking_status, updated_at = now() WHERE id = ${id}`;
      return { ok: true } as const;
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23P01") return { ok: false, error: "Another active booking overlaps these dates." };
    throw e;
  }
}

export async function updateBookingAdminFields(id: number, fields: { paymentStatus: string; adminNotes: string }) {
  await sql()`UPDATE bookings SET payment_status = ${fields.paymentStatus}::payment_status, admin_notes = ${fields.adminNotes}, updated_at = now() WHERE id = ${id}`;
}

/** Busy intervals for the public calendar. Contains no customer data. */
export async function busyIntervals(vehicleId: number, from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  const rows = await sql()<{ start: Date; end: Date }[]>`
    SELECT pickup_at AS start, return_at AS "end" FROM bookings
      WHERE vehicle_id = ${vehicleId} AND status IN ('pending','confirmed') AND return_at > ${from} AND pickup_at < ${to}
    UNION ALL
    SELECT starts_at, ends_at FROM blocked_periods
      WHERE vehicle_id = ${vehicleId} AND ends_at > ${from} AND starts_at < ${to}
    ORDER BY 1`;
  return rows;
}

export async function listBlocked(vehicleId: number) {
  return sql()<{ id: string; starts_at: Date; ends_at: Date; reason: string }[]>`
    SELECT id, starts_at, ends_at, reason FROM blocked_periods WHERE vehicle_id = ${vehicleId} AND ends_at > now() - interval '30 days' ORDER BY starts_at`;
}

export async function addBlocked(vehicleId: number, start: Date, end: Date, reason: string) {
  await sql()`INSERT INTO blocked_periods (vehicle_id, starts_at, ends_at, reason) VALUES (${vehicleId}, ${start}, ${end}, ${reason})`;
}

export async function removeBlocked(vehicleId: number, id: number) {
  await sql()`DELETE FROM blocked_periods WHERE id = ${id} AND vehicle_id = ${vehicleId}`;
}

export async function dashboardStats() {
  const [r] = await sql()<{ pending: string; upcoming: string; enquiries: string; vehicles: string }[]>`
    SELECT
      (SELECT count(*) FROM bookings WHERE status = 'pending') AS pending,
      (SELECT count(*) FROM bookings WHERE status = 'confirmed' AND pickup_at > now()) AS upcoming,
      (SELECT count(*) FROM enquiries WHERE NOT is_handled) AS enquiries,
      (SELECT count(*) FROM vehicles WHERE archived_at IS NULL) AS vehicles`;
  return { pending: Number(r.pending), upcoming: Number(r.upcoming), enquiries: Number(r.enquiries), vehicles: Number(r.vehicles) };
}

/** Vehicle IDs with an active booking or block overlapping the window (used to label fleet cards). */
export async function busyVehicleIds(pickupAt: Date, returnAt: Date): Promise<Set<number>> {
  const rows = await sql()<{ vehicle_id: string }[]>`
    SELECT vehicle_id FROM bookings WHERE status IN ('pending','confirmed') AND tstzrange(pickup_at, return_at, '[)') && tstzrange(${pickupAt}, ${returnAt}, '[)')
    UNION
    SELECT vehicle_id FROM blocked_periods WHERE tstzrange(starts_at, ends_at, '[)') && tstzrange(${pickupAt}, ${returnAt}, '[)')`;
  return new Set(rows.map((r) => Number(r.vehicle_id)));
}
