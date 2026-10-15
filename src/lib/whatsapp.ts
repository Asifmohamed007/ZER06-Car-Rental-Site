export type WhatsAppDetails = {
  businessName: string;
  vehicleName?: string;
  pickup?: string;
  return?: string;
  location?: string;
  estimate?: string;
  reference?: string;
};

export function buildWhatsAppMessage(d: WhatsAppDetails): string {
  const lines = [`Hello ${d.businessName}, I'd like to ask about renting a car.`];
  if (d.reference) lines.push(`Booking reference: ${d.reference}`);
  if (d.vehicleName) lines.push(`Car: ${d.vehicleName}`);
  if (d.pickup) lines.push(`Pickup: ${d.pickup}`);
  if (d.return) lines.push(`Return: ${d.return}`);
  if (d.location) lines.push(`Location: ${d.location}`);
  if (d.estimate) lines.push(`Estimated price: ${d.estimate}`);
  lines.push("Is it available?");
  return lines.join("\n");
}

/** Returns a wa.me link, or null when no valid number is configured. */
export function whatsappLink(number: string, message?: string): string | null {
  const digits = (number || "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
