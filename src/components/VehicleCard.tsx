import Link from "next/link";
import type { Vehicle } from "@/server/vehicles";
import { categoryLabels, formatMoney } from "@/lib/format";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { SafeImage } from "./SafeImage";
import { WaIcon } from "./WhatsAppButton";

export type CardAvailability = "available" | "unavailable" | "booked";

export function VehicleCard({ v, query = "", whatsapp, businessName, availability, priority = false }: {
  v: Vehicle; query?: string; whatsapp: string; businessName: string; availability: CardAvailability; priority?: boolean;
}) {
  const name = `${v.brand} ${v.model}`;
  const href = `/fleet/${v.slug}${query}`;
  const wa = whatsappLink(whatsapp, buildWhatsAppMessage({ businessName, vehicleName: `${v.year} ${name}` }));
  const bookable = availability === "available";
  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="cut relative block aspect-[4/3] overflow-hidden bg-navy-800" tabIndex={-1} aria-hidden>
        <SafeImage src={v.images[0]?.src ?? ""} alt="" fill priority={priority} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 chip bg-ink/70 text-cream backdrop-blur">{categoryLabels[v.category]}</span>
        <AvailabilityBadge state={availability} />
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-cream/55">{v.year} {v.brand}</p>
            <h3 className="display text-[2rem]"><Link href={href} className="hover:text-white focus-visible:outline-offset-4">{v.model}</Link></h3>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-2xl font-bold">{formatMoney(v.dailyRate)}</span>
            <span className="text-sm text-cream/55">per day</span>
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream/70" aria-label="Specifications">
          <li className="capitalize">{v.transmission}</li>
          <li>{v.seats} seats</li>
          {v.fuelType && <li>{v.fuelType}</li>}
        </ul>
        {v.summary && <p className="mt-3 line-clamp-2 text-cream/70">{v.summary}</p>}
        <div className="mt-auto flex gap-2 pt-5">
          <Link href={href} className="btn-ghost btn-sm flex-1">View details</Link>
          {bookable ? (
            <Link href={`${href}${query ? "&" : "?"}book=1#book`} className="btn-primary btn-sm flex-1">Book now</Link>
          ) : (
            <span className="btn-ghost btn-sm flex-1 opacity-50" aria-disabled>{availability === "booked" ? "Booked for these dates" : "Not taking bookings"}</span>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa btn-sm px-3" aria-label={`Ask about the ${name} on WhatsApp`}>
              <WaIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function AvailabilityBadge({ state }: { state: CardAvailability }) {
  const map = {
    available: ["Available", "bg-ok"],
    booked: ["Booked for your dates", "bg-warn"],
    unavailable: ["Unavailable", "bg-bad"],
  } as const;
  const [label, dot] = map[state];
  return (
    <span className="absolute right-4 top-4 chip bg-ink/70 text-cream backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />{label}
    </span>
  );
}
