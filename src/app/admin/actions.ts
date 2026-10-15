"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, verifyCredentials, startSession, endSession, ForbiddenError } from "@/server/auth";
import { rateLimit, clearRateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";
import { audit } from "@/server/audit";
import { logError } from "@/server/log";
import * as vehicles from "@/server/vehicles";
import * as bookings from "@/server/bookings";
import { setEnquiryHandled } from "@/server/enquiries";
import { getSettings, saveSettings } from "@/server/settings";
import { vehicleSchema, fieldErrors } from "@/lib/validation";
import { validateUpload } from "@/lib/uploads";
import { zonedToUtc } from "@/lib/time";
import { parseBlocks, parseLocations, parsePairs } from "@/lib/settings-form";

export type FormState = { ok?: boolean; message?: string; fields?: Record<string, string> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? NaN);
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const idOf = (fd: FormData, k = "id") => {
  const n = Number(fd.get(k));
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("Invalid id");
  return n;
};
const isRedirect = (e: unknown) => String((e as { digest?: string })?.digest ?? "").startsWith("NEXT_REDIRECT");

/* ---------- auth ---------- */

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim().toLowerCase().slice(0, 200);
  const password = str(fd, "password").slice(0, 200);
  if (!email || !password) return { message: "Enter your email and password." };
  const ip = clientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 20, 900), rateLimit(`login-email:${email}`, 6, 900)]);
  if (!byIp.ok || !byEmail.ok) return { message: "Too many sign-in attempts. Wait 15 minutes and try again." };
  const admin = await verifyCredentials(email, password);
  if (!admin) return { message: "That email and password don't match an admin account." };
  await clearRateLimit(`login-email:${email}`);
  await startSession(admin.id);
  await audit(admin.id, "login", "admin", admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- vehicles ---------- */

export async function saveVehicleAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const idRaw = str(fd, "id");
  const parsed = vehicleSchema.safeParse({
    brand: str(fd, "brand"), model: str(fd, "model"), year: str(fd, "year"), slug: str(fd, "slug"),
    category: str(fd, "category"), transmission: str(fd, "transmission"), seats: str(fd, "seats"), fuelType: str(fd, "fuelType"),
    dailyRate: str(fd, "dailyRate"), deposit: str(fd, "deposit") || "0", summary: str(fd, "summary"), description: str(fd, "description"),
    features: str(fd, "features").split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    isAvailable: bool(fd, "isAvailable"), isFeatured: bool(fd, "isFeatured"),
    seoTitle: str(fd, "seoTitle"), seoDescription: str(fd, "seoDescription"),
  });
  if (!parsed.success) return { message: "Check the highlighted fields.", fields: fieldErrors(parsed.error) };
  let id: number;
  try {
    if (idRaw) {
      id = idOf(fd);
      await vehicles.updateVehicle(id, parsed.data);
      await audit(admin.id, "update", "vehicle", id, { dailyRate: parsed.data.dailyRate, isAvailable: parsed.data.isAvailable });
    } else {
      id = await vehicles.createVehicle(parsed.data);
      await audit(admin.id, "create", "vehicle", id);
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { message: "Another car already uses this URL slug.", fields: { slug: "Choose a different slug" } };
    logError("admin.vehicle_save", e);
    return { message: "Couldn't save the car. Try again." };
  }
  revalidatePath("/", "layout");
  if (!idRaw) redirect(`/admin/vehicles/${id}?created=1`);
  return { ok: true, message: "Changes saved." };
}

export async function archiveVehicleAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = idOf(fd);
  const archive = str(fd, "archive") === "1";
  await vehicles.setArchived(id, archive);
  await audit(admin.id, archive ? "archive" : "restore", "vehicle", id);
  revalidatePath("/", "layout");
}

export async function deleteVehicleAction(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdmin("owner");
    const id = idOf(fd);
    const r = await vehicles.deleteVehicleIfUnused(id);
    if (r === "has_bookings") return { message: "This car has booking history, so it can't be deleted. Archive it instead to hide it from the site." };
    await audit(admin.id, "delete", "vehicle", id);
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: e.message };
    if (isRedirect(e)) throw e;
    logError("admin.vehicle_delete", e);
    return { message: "Couldn't delete the car. Try again." };
  }
  revalidatePath("/", "layout");
  redirect("/admin/vehicles?deleted=1");
}

export async function uploadImageAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = idOf(fd, "vehicleId");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose an image to upload." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bytes);
  if (!check.ok) return { message: check.error };
  await vehicles.addUploadedImage(id, Buffer.from(bytes), check.mime, str(fd, "alt").slice(0, 200));
  await audit(admin.id, "upload_image", "vehicle", id);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo uploaded." };
}

export async function addImageUrlAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = idOf(fd, "vehicleId");
  const url = str(fd, "url").trim();
  const ok = z.string().url().max(500).refine((u) => /^https:\/\/(images\.unsplash\.com|images\.pexels\.com)\//.test(u)).safeParse(url);
  if (!ok.success) return { message: "Use an https link from images.unsplash.com or images.pexels.com, or upload the photo instead." };
  await vehicles.addExternalImage(id, url, str(fd, "alt").slice(0, 200));
  await audit(admin.id, "add_image_url", "vehicle", id);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo added." };
}

export async function imageAction(fd: FormData) {
  const admin = await requireAdmin();
  const vehicleId = idOf(fd, "vehicleId");
  const imageId = idOf(fd, "imageId");
  const op = str(fd, "op") === "delete" ? "delete" : "primary";
  if (op === "delete") await vehicles.deleteImage(vehicleId, imageId);
  else await vehicles.moveImageFirst(vehicleId, imageId);
  await audit(admin.id, `image_${op}`, "vehicle", vehicleId, { imageId });
  revalidatePath("/", "layout");
}

export async function addBlockAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const s = await getSettings();
  const id = idOf(fd, "vehicleId");
  const start = zonedToUtc(str(fd, "startDate"), str(fd, "startTime") || "00:00", s.regional.timezone);
  const end = zonedToUtc(str(fd, "endDate"), str(fd, "endTime") || "23:59", s.regional.timezone);
  if (!start || !end) return { message: "Choose a valid start and end." };
  if (end <= start) return { message: "The end must be after the start." };
  await bookings.addBlocked(id, start, end, str(fd, "reason").slice(0, 200));
  await audit(admin.id, "block_dates", "vehicle", id);
  revalidatePath(`/admin/vehicles/${id}`);
  return { ok: true, message: "Dates blocked." };
}

export async function removeBlockAction(fd: FormData) {
  const admin = await requireAdmin();
  const vehicleId = idOf(fd, "vehicleId");
  await bookings.removeBlocked(vehicleId, idOf(fd, "blockId"));
  await audit(admin.id, "unblock_dates", "vehicle", vehicleId);
  revalidatePath(`/admin/vehicles/${vehicleId}`);
}

/* ---------- bookings ---------- */

export async function bookingStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  const next = str(fd, "status");
  if (!["confirmed", "cancelled", "completed"].includes(next)) return { message: "Unknown status." };
  const r = await bookings.changeBookingStatus(id, next);
  if (!r.ok) return { message: r.error };
  await audit(admin.id, `booking_${next}`, "booking", id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Booking marked ${next}.` };
}

export async function bookingDetailsAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  const paymentStatus = str(fd, "paymentStatus");
  if (!["unpaid", "pending", "paid", "failed", "refunded"].includes(paymentStatus)) return { message: "Unknown payment status." };
  await bookings.updateBookingAdminFields(id, { paymentStatus, adminNotes: str(fd, "adminNotes").slice(0, 4000) });
  await audit(admin.id, "booking_update", "booking", id, { paymentStatus });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved." };
}

/* ---------- enquiries ---------- */

export async function enquiryHandledAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = idOf(fd);
  await setEnquiryHandled(id, str(fd, "handled") === "1");
  await audit(admin.id, "enquiry_handled", "enquiry", id);
  revalidatePath("/admin", "layout");
}

/* ---------- settings ---------- */

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try {
    admin = await requireAdmin("owner");
  } catch (e) {
    if (e instanceof ForbiddenError) return { message: e.message };
    throw e;
  }
  const current = await getSettings();
  const next = {
    business: {
      name: str(fd, "business.name"), shortName: str(fd, "business.shortName"), tagline: str(fd, "business.tagline"),
      description: str(fd, "business.description"), phone: str(fd, "business.phone"), email: str(fd, "business.email"),
      whatsapp: str(fd, "business.whatsapp").replace(/\D/g, ""), address: str(fd, "business.address"), mapsUrl: str(fd, "business.mapsUrl"),
      instagram: str(fd, "business.instagram"), hours: parsePairs(str(fd, "business.hours")), established: str(fd, "business.established"),
    },
    regional: current.regional,
    booking: {
      requireApproval: bool(fd, "booking.requireApproval"), graceMinutes: num(fd, "booking.graceMinutes"), minDays: num(fd, "booking.minDays"),
      maxDays: num(fd, "booking.maxDays"), minLeadHours: num(fd, "booking.minLeadHours"), maxAdvanceDays: num(fd, "booking.maxAdvanceDays"),
      additionalDriverPerDay: num(fd, "booking.additionalDriverPerDay"), taxPercent: num(fd, "booking.taxPercent"),
      locations: parseLocations(str(fd, "booking.locations")),
    },
    payments: { payOnArrival: bool(fd, "payments.payOnArrival"), arrangeWithTeam: bool(fd, "payments.arrangeWithTeam"), onlineEnabled: false, note: str(fd, "payments.note") },
    policies: Object.fromEntries(Object.keys(current.policies).map((k) => [k, k === "minDriverAge" ? num(fd, `policies.${k}`) : str(fd, `policies.${k}`)])),
    homepage: {
      heroHeadline: str(fd, "homepage.heroHeadline"), heroSubtext: str(fd, "homepage.heroSubtext"), heroImage: str(fd, "homepage.heroImage"),
      eventsTitle: str(fd, "homepage.eventsTitle"), eventsText: str(fd, "homepage.eventsText"), eventsImage: str(fd, "homepage.eventsImage"),
      faqs: parseBlocks(str(fd, "homepage.faqs")).map((b) => ({ q: b.head, a: b.body })),
      reviews: parseBlocks(str(fd, "homepage.reviews")).map((b) => {
        const [name, source = ""] = b.head.split("|").map((x) => x.trim());
        return { name, source, text: b.body };
      }),
    },
    about: { intro: str(fd, "about.intro"), story: str(fd, "about.story"), services: parseBlocks(str(fd, "about.services")).map((b) => ({ title: b.head, text: b.body })) },
    seo: { defaultTitle: str(fd, "seo.defaultTitle"), defaultDescription: str(fd, "seo.defaultDescription"), ogImage: str(fd, "seo.ogImage") },
  };
  if (!next.payments.payOnArrival && !next.payments.arrangeWithTeam) return { message: "Turn on at least one payment option." };
  const r = await saveSettings(next);
  if (!r.ok) {
    if ("message" in r && r.message) return { message: r.message };
    return { message: "Some settings aren't valid. Check the highlighted fields.", fields: "error" in r && r.error ? fieldErrors(r.error) : {} };
  }
  await audit(admin.id, "update", "settings", "site");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. The website now shows the new details." };
}
