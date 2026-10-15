import type { Metadata } from "next";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = {
  title: "Rental policies",
  description: "Deposits, mileage, fuel, cancellation, insurance and driver requirements for renting a car with us in Qatar.",
  alternates: { canonical: "/policies" },
};

export default async function PoliciesPage() {
  const s = await getSettings();
  const p = s.policies;
  const items: [string, string][] = [
    ["Driver requirements", `Drivers must be at least ${p.minDriverAge} years old. ${p.licence}`],
    ["Security deposit", p.deposit],
    ["Mileage", p.mileage],
    ["Fuel", p.fuel],
    ["Cancellations and refunds", p.cancellation],
    ["Changing a booking", p.modification],
    ["Late returns", p.lateReturn],
    ["Insurance", p.insurance],
    ["Additional drivers", p.additionalDrivers],
    ["Delivery and collection", p.delivery],
    ["Taxes and fees", p.taxes],
    ["How rental days are counted", `You're charged one day for every 24 hours from pickup${s.booking.graceMinutes ? `, with ${s.booking.graceMinutes} minutes' grace before an extra day is added` : ""}. The minimum rental is ${s.booking.minDays} day${s.booking.minDays === 1 ? "" : "s"}.`],
  ];
  return (
    <div className="page max-w-4xl pb-10 pt-[calc(var(--header-h)+3rem)]">
      <h1 className="h1">Rental policies</h1>
      <p className="lede mt-5">Please read these before you book. Ask us if anything is unclear.</p>
      <dl className="mt-12 divide-y divide-cream/10 border-y border-cream/10">
        {items.map(([k, v]) => (
          <div key={k} className="grid gap-2 py-6 md:grid-cols-[16rem_1fr] md:gap-8">
            <dt className="font-display text-xl font-semibold">{k}</dt>
            <dd className="prose-z whitespace-pre-line">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
