import { z } from "zod";

const text = (max = 2000) => z.string().trim().max(max);

export const locationSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]{1,40}$/, "Use lowercase letters, numbers and dashes"),
  name: text(120).min(1),
  fee: z.number().int().min(0).max(100000),
});

export const settingsSchema = z.object({
  business: z.object({
    name: text(120).min(1),
    shortName: text(40).min(1),
    tagline: text(200),
    description: text(600),
    phone: text(40),
    email: text(200),
    whatsapp: z.string().trim().regex(/^\d{0,15}$/, "Digits only, including country code (e.g. 974XXXXXXXX)"),
    address: text(300),
    mapsUrl: text(500),
    instagram: text(300),
    hours: z.array(z.object({ label: text(60).min(1), value: text(60).min(1) })).max(10),
    established: text(10),
  }),
  regional: z.object({
    currency: text(5).min(3),
    timezone: text(60).min(1),
    locale: text(20).min(2),
  }),
  booking: z.object({
    requireApproval: z.boolean(),
    graceMinutes: z.number().int().min(0).max(720),
    minDays: z.number().int().min(1).max(30),
    maxDays: z.number().int().min(1).max(365),
    minLeadHours: z.number().int().min(0).max(240),
    maxAdvanceDays: z.number().int().min(1).max(730),
    additionalDriverPerDay: z.number().int().min(0).max(10000),
    taxPercent: z.number().min(0).max(100),
    locations: z.array(locationSchema).min(1).max(30),
  }),
  payments: z.object({
    payOnArrival: z.boolean(),
    arrangeWithTeam: z.boolean(),
    onlineEnabled: z.boolean(),
    note: text(600),
  }),
  policies: z.object({
    minDriverAge: z.number().int().min(16).max(99),
    deposit: text(),
    mileage: text(),
    fuel: text(),
    cancellation: text(),
    modification: text(),
    lateReturn: text(),
    insurance: text(),
    licence: text(),
    additionalDrivers: text(),
    delivery: text(),
    taxes: text(),
  }),
  homepage: z.object({
    heroHeadline: text(120).min(1),
    heroSubtext: text(300),
    heroImage: text(500),
    eventsTitle: text(120),
    eventsText: text(600),
    eventsImage: text(500),
    faqs: z.array(z.object({ q: text(300).min(1), a: text(2000).min(1) })).max(30),
    reviews: z.array(z.object({ name: text(80).min(1), text: text(800).min(1), source: text(80) })).max(30),
  }),
  about: z.object({
    intro: text(1200),
    story: text(4000),
    services: z.array(z.object({ title: text(80).min(1), text: text(400) })).max(12),
  }),
  seo: z.object({
    defaultTitle: text(120).min(1),
    defaultDescription: text(300),
    ogImage: text(500),
  }),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type PickupLocation = z.infer<typeof locationSchema>;

const TBC = "To be confirmed by ZER06 before launch.";

export const defaultSettings: SiteSettings = {
  business: {
    name: "ZER06 Rental Cars",
    shortName: "ZER06",
    tagline: "Stop dreaming about the destination. Start enjoying the drive.",
    description:
      "Discover your next journey with ZER06 RENTAL CARS. Explore quality vehicles, transparent rental options, and a convenient booking experience designed to put you in control of every drive.",
    phone: "0000",
    email: "example@example.com",
    whatsapp: "97400000000",
    address: "Location to be confirmed",
    mapsUrl: "",
    instagram: "https://www.instagram.com/zero6_rentalcars/",
    hours: [
      { label: "Saturday to Thursday", value: "9:00 to 21:00" },
      { label: "Friday", value: "14:00 to 21:00" },
    ],
    established: "2024",
  },
  regional: { currency: "QAR", timezone: "Asia/Qatar", locale: "en-QA" },
  booking: {
    requireApproval: true,
    graceMinutes: 60,
    minDays: 1,
    maxDays: 60,
    minLeadHours: 2,
    maxAdvanceDays: 365,
    additionalDriverPerDay: 0,
    taxPercent: 0,
    locations: [
      { id: "office", name: "ZER06 office", fee: 0 },
      { id: "airport", name: "Hamad International Airport", fee: 0 },
      { id: "delivery", name: "Delivery to your address in Doha", fee: 0 },
    ],
  },
  payments: {
    payOnArrival: true,
    arrangeWithTeam: true,
    onlineEnabled: false,
    note: "No payment is taken online. Our team confirms your booking and payment arrangements by phone or WhatsApp.",
  },
  policies: {
    minDriverAge: 21,
    deposit: TBC,
    mileage: TBC,
    fuel: TBC,
    cancellation: TBC,
    modification: TBC,
    lateReturn: TBC,
    insurance: TBC,
    licence: TBC,
    additionalDrivers: TBC,
    delivery: TBC,
    taxes: TBC,
  },
  homepage: {
    heroHeadline: "Your Journey. Your Rules.",
    heroSubtext: "Stop dreaming about the destination. Start enjoying the drive.",
    heroImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=70",
    eventsTitle: "Make your wedding day unforgettable",
    eventsText:
      "Arrive in style on the day that matters. Tell us your date, route and the look you have in mind, and we will match you with the right car for the occasion.",
    eventsImage: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=70",
    faqs: [
      { q: "How do I book a car?", a: "Choose a car, pick your dates and locations, and send a booking request. We review it and confirm by phone, email or WhatsApp. Your booking is only confirmed once you hear back from us." },
      { q: "Do I need to pay online?", a: "No. You can pay on arrival or arrange payment with our team after we confirm your booking." },
      { q: "What do I need to rent a car?", a: "A valid driving licence and identification. The exact requirements are listed in our rental policies." },
      { q: "How is the rental price calculated?", a: "You pay the daily rate for each 24-hour period from pickup, plus any location or extra-driver fees shown in your price breakdown before you send the request." },
      { q: "Can I book on WhatsApp instead?", a: "Yes. WhatsApp messages are treated as enquiries. We will reply with availability and confirm your booking from there." },
    ],
    reviews: [],
  },
  about: {
    intro:
      "ZER06 Rental Cars is a car rental service built around one idea: you should be in control of every drive.",
    story:
      "Edit this text in the admin dashboard to tell your story: how ZER06 started, the cars you specialise in, and what customers can expect when they rent with you.",
    services: [
      { title: "Daily rentals", text: "Cars for a day, a week or longer, with a clear price before you book." },
      { title: "Weddings and events", text: "Arrive in style on the day that matters most." },
      { title: "Pickup and delivery", text: "Collect from us or ask about delivery to your address." },
    ],
  },
  seo: {
    defaultTitle: "ZER06 Rental Cars | Car rental in Qatar",
    defaultDescription:
      "Rent a car in Qatar with ZER06 Rental Cars. Browse economy cars, sedans, SUVs and luxury cars with daily prices in QAR and send a booking request online or on WhatsApp.",
    ogImage: "/brand/logo-512.png",
  },
};

/** Deep-merge stored settings over defaults so new fields always have values. */
export function mergeSettings(stored: unknown): SiteSettings {
  const merged = deepMerge(defaultSettings, stored) as SiteSettings;
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultSettings;
}

function deepMerge(base: unknown, over: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (over && typeof over === "object" && !Array.isArray(over)) {
      for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
        if (k in out) out[k] = deepMerge(out[k], v);
      }
    }
    return out;
  }
  return over === undefined || typeof over !== typeof base ? base : over;
}
