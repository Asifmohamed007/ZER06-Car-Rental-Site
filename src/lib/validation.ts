import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time");

export const quoteRequestSchema = z.object({
  vehicleSlug: z.string().trim().min(1).max(100),
  pickupDate: date,
  pickupTime: time,
  returnDate: date,
  returnTime: time,
  pickupLocation: z.string().trim().min(1, "Choose a pickup location").max(40),
  returnLocation: z.string().trim().min(1, "Choose a return location").max(40),
  additionalDriver: z.boolean().default(false),
});

export const bookingRequestSchema = quoteRequestSchema.extend({
  idempotencyKey: z.string().uuid("Reload the page and try again"),
  customerName: z.string().trim().min(2, "Enter your full name").max(120),
  customerPhone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  customerEmail: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  driverAge: z.coerce.number().int().min(16, "Enter the driver's age").max(99),
  notes: z.string().trim().max(1000).default(""),
  paymentMethod: z.enum(["pay_on_arrival", "arrange_with_team"]),
  acceptPolicies: z.literal(true, { errorMap: () => ({ message: "Accept the rental policies to continue" }) }),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Enter a valid phone number").default(""),
  subject: z.string().trim().max(150).default(""),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(4000),
  website: z.string().max(0).optional(),
});

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "Required").max(60),
  model: z.string().trim().min(1, "Required").max(80),
  year: z.coerce.number().int().min(1950).max(2100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only").max(100),
  category: z.enum(["economy", "sedan", "suv", "luxury", "sports", "van"]),
  transmission: z.enum(["automatic", "manual"]),
  seats: z.coerce.number().int().min(1).max(60),
  fuelType: z.string().trim().max(40).default(""),
  dailyRate: z.coerce.number().int("Whole riyals only").min(1).max(1_000_000),
  deposit: z.coerce.number().int("Whole riyals only").min(0).max(1_000_000),
  summary: z.string().trim().max(300).default(""),
  description: z.string().trim().max(5000).default(""),
  features: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  seoTitle: z.string().trim().max(120).default(""),
  seoDescription: z.string().trim().max(300).default(""),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
