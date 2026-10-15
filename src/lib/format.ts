export function formatMoney(amount: number, currency = "QAR", locale = "en-QA"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en")}`;
  }
}

export function formatDateTime(instant: Date | string, timeZone: string, locale = "en-GB"): string {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat(locale, {
    timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(d);
}

export const categoryLabels: Record<string, string> = {
  economy: "Economy", sedan: "Sedan", suv: "SUV", luxury: "Luxury", sports: "Sports", van: "Van",
};

export const statusLabels: Record<string, string> = {
  pending: "Awaiting confirmation", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed",
};

export function slugify(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
