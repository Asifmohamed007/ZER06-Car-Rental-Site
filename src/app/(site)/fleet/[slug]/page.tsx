import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/server/settings";
import { getVehicleBySlug } from "@/server/vehicles";
import { Gallery } from "@/components/Gallery";
import { BookingPanel } from "@/components/BookingPanel";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { categoryLabels, formatMoney } from "@/lib/format";
import { defaultWindow } from "@/lib/time";
import { siteUrl } from "@/lib/site-url";

type Params = { params: { slug: string }; searchParams: Record<string, string | undefined> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const v = await getVehicleBySlug(params.slug).catch(() => null);
  if (!v) return { title: "Car not found", robots: { index: false } };
  const name = `${v.year} ${v.brand} ${v.model}`;
  const title = v.seoTitle || `Rent a ${v.brand} ${v.model} in Qatar`;
  const description = v.seoDescription || `${name} for rent in Qatar from ${formatMoney(v.dailyRate)} per day. ${v.seats} seats, ${v.transmission}${v.fuelType ? `, ${v.fuelType.toLowerCase()}` : ""}. Book online or on WhatsApp.`;
  return {
    title, description,
    alternates: { canonical: `/fleet/${v.slug}` },
    openGraph: { title, description, url: `/fleet/${v.slug}`, images: v.images[0] ? [{ url: v.images[0].src }] : undefined },
  };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/, TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export default async function VehiclePage({ params, searchParams }: Params) {
  const [s, v] = await Promise.all([getSettings(), getVehicleBySlug(params.slug)]);
  if (!v) notFound();
  const name = `${v.year} ${v.brand} ${v.model}`;
  const def = defaultWindow(s.regional.timezone);
  const pick = (k: "pickupDate" | "returnDate" | "pickupTime" | "returnTime") => {
    const val = searchParams[k] ?? "";
    return (k.endsWith("Date") ? DATE : TIME).test(val) ? val : def[k];
  };
  const initial = { pickupDate: pick("pickupDate"), pickupTime: pick("pickupTime"), returnDate: pick("returnDate"), returnTime: pick("returnTime") };

  const specs: [string, string][] = [
    ["Type", categoryLabels[v.category]],
    ["Transmission", v.transmission[0].toUpperCase() + v.transmission.slice(1)],
    ["Seats", String(v.seats)],
    ...(v.fuelType ? [["Fuel", v.fuelType] as [string, string]] : []),
    ["Year", String(v.year)],
    ["Security deposit", v.deposit > 0 ? formatMoney(v.deposit) : "Ask us"],
  ];
  const policy: [string, string][] = [
    ["Minimum driver age", `${s.policies.minDriverAge}`],
    ["Mileage", s.policies.mileage],
    ["Fuel", s.policies.fuel],
    ["Deposit", s.policies.deposit],
    ["Cancellation", s.policies.cancellation],
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Car", name, brand: { "@type": "Brand", name: v.brand }, model: v.model,
    vehicleModelDate: String(v.year), vehicleTransmission: v.transmission, seatingCapacity: v.seats,
    ...(v.fuelType ? { fuelType: v.fuelType } : {}),
    image: v.images.map((i) => (i.src.startsWith("http") ? i.src : `${siteUrl()}${i.src}`)),
    url: `${siteUrl()}/fleet/${v.slug}`,
    offers: {
      "@type": "Offer", priceCurrency: s.regional.currency, price: v.dailyRate,
      priceSpecification: { "@type": "UnitPriceSpecification", price: v.dailyRate, priceCurrency: s.regional.currency, unitCode: "DAY" },
      availability: v.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="page pb-10 pt-[calc(var(--header-h)+2rem)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-cream/60">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-cream">Home</Link></li><li aria-hidden>/</li>
          <li><Link href="/fleet" className="hover:text-cream">Fleet</Link></li><li aria-hidden>/</li>
          <li aria-current="page" className="text-cream">{v.brand} {v.model}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <Gallery images={v.images} name={name} />
          <div className="mt-10">
            <p className="text-cream/60">{v.year} {v.brand}</p>
            <h1 className="h1">{v.model}</h1>
            <p className="mt-4 font-display text-3xl font-bold">{formatMoney(v.dailyRate)} <span className="font-sans text-base font-normal text-cream/60">per day</span></p>
            {v.description && <div className="prose-z mt-6">{v.description.split(/\n{2,}/).map((p) => <p key={p.slice(0, 30)}>{p}</p>)}</div>}
          </div>

          <dl className="mt-10 grid grid-cols-2 border-t border-cream/10 sm:grid-cols-3">
            {specs.map(([k, val]) => (
              <div key={k} className="border-b border-cream/10 py-4 pr-4">
                <dt className="text-sm text-cream/55">{k}</dt><dd className="mt-1 text-lg">{val}</dd>
              </div>
            ))}
          </dl>

          {v.features.length > 0 && (
            <section className="mt-10" aria-labelledby="feat-h">
              <h2 id="feat-h" className="h3">Features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {v.features.map((f) => <li key={f} className="flex items-center gap-3 text-cream/80"><span className="h-px w-4 bg-chrome" aria-hidden />{f}</li>)}
              </ul>
            </section>
          )}

          <section className="mt-12" aria-labelledby="cond-h">
            <h2 id="cond-h" className="h3">Rental conditions</h2>
            <dl className="mt-4 space-y-4">
              {policy.map(([k, val]) => <div key={k}><dt className="text-sm text-cream/55">{k}</dt><dd className="mt-1 text-cream/85">{val}</dd></div>)}
            </dl>
            <Link href="/policies" className="mt-5 inline-block underline underline-offset-4 hover:text-white">Read all rental policies</Link>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div id="book" className="glass cut scroll-mt-28 p-6 sm:p-7">
            <h2 className="h2 mb-6 text-[2.25rem]">Book this car</h2>
            <BookingPanel
              vehicle={{ slug: v.slug, name, isAvailable: v.isAvailable }}
              locations={s.booking.locations}
              payments={s.payments}
              minDriverAge={s.policies.minDriverAge}
              requireApproval={s.booking.requireApproval}
              currency={s.regional.currency}
              businessName={s.business.name}
              whatsapp={s.business.whatsapp}
              today={def.today}
              initial={initial}
            />
          </div>
          <div className="mt-6">
            <h2 className="sr-only">Availability</h2>
            <AvailabilityCalendar slug={v.slug} today={def.today} />
          </div>
        </aside>
      </div>
    </div>
  );
}
