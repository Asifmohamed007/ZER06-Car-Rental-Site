export type PricingPolicy = {
  graceMinutes: number;
  minDays: number;
  additionalDriverPerDay: number;
  taxPercent: number;
};

export type QuoteInput = {
  pickupAt: Date;
  returnAt: Date;
  dailyRate: number;
  pickupFee: number;
  returnFee: number;
  pickupLocationName: string;
  returnLocationName: string;
  additionalDriver: boolean;
  deposit: number;
};

export type QuoteLine = { label: string; amount: number };
export type Quote = {
  billableDays: number;
  lines: QuoteLine[];
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
};

const MINUTE = 60_000;
const DAY_MINUTES = 24 * 60;

/**
 * Billing policy: one day is charged for every started 24-hour period after pickup.
 * A configurable grace period is forgiven before a new day is charged
 * (e.g. with 60 minutes of grace, 25h00 is 1 day and 25h01 is 2 days).
 * The minimum charge is `minDays`.
 */
export function billableDays(pickupAt: Date, returnAt: Date, policy: Pick<PricingPolicy, "graceMinutes" | "minDays">): number {
  const minutes = Math.ceil((returnAt.getTime() - pickupAt.getTime()) / MINUTE);
  if (minutes <= 0) throw new Error("Return must be after pickup");
  const chargeable = Math.max(0, minutes - policy.graceMinutes);
  return Math.max(policy.minDays, Math.ceil(chargeable / DAY_MINUTES));
}

/** All amounts are whole QAR. Tax is rounded to the nearest riyal. */
export function computeQuote(input: QuoteInput, policy: PricingPolicy): Quote {
  const days = billableDays(input.pickupAt, input.returnAt, policy);
  const lines: QuoteLine[] = [
    { label: `Rental: ${days} day${days === 1 ? "" : "s"}`, amount: days * input.dailyRate },
  ];
  if (input.pickupFee > 0) lines.push({ label: `Pickup: ${input.pickupLocationName}`, amount: input.pickupFee });
  if (input.returnFee > 0) lines.push({ label: `Return: ${input.returnLocationName}`, amount: input.returnFee });
  if (input.additionalDriver && policy.additionalDriverPerDay > 0) {
    lines.push({ label: `Additional driver: ${days} day${days === 1 ? "" : "s"}`, amount: days * policy.additionalDriverPerDay });
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const tax = Math.round((subtotal * policy.taxPercent) / 100);
  return { billableDays: days, lines, subtotal, tax, total: subtotal + tax, deposit: input.deposit };
}
