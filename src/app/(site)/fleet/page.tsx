import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/settings";
import { listVehicles, type FleetFilters } from "@/server/vehicles";
import { busyVehicleIds } from "@/server/bookings";
import { safeRead } from "@/server/safe";
import { VehicleCard, type CardAvailability } from "@/components/VehicleCard";
import { StatusNote } from "@/components/StatusNote";
import { AutoSubmitForm } from "@/components/AutoSubmit";
import { categoryLabels, formatDateTime } from "@/lib/format";
import { checkRentalWindow } from "@/lib/booking-rules";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const CATS = ["economy", "sedan", "suv", "luxury", "sports", "van"];
const SORTS = { featured: "Recommended", "price-asc": "Price: low to high", "price-desc": "Price: high to low", newest: "Newest models" };

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const cat = one(searchParams.category);
  const onlyCategory = CATS.includes(cat) && Object.keys(searchParams).length === 1;
  const label = categoryLabels[cat];
  return {
    title: label ? `${label} car rental in Qatar` : "Our fleet: rent a car in Qatar",
    description: label
      ? `Browse ${label.toLowerCase()} cars for rent in Qatar with daily prices in QAR. Send a booking request online or on WhatsApp.`
      : "Browse economy cars, sedans, SUVs and luxury cars for daily hire in Qatar. Filter by type, transmission and price.",
    alternates: { canonical: onlyCategory ? `/fleet?category=${cat}` : "/fleet" },
    robots: Object.keys(searchParams).length === 0 || onlyCategory ? undefined : { index: false, follow: true },
  };
}

export default async function FleetPage({ searchParams }: { searchParams: SP }) {
  const s = await getSettings();
  const f: FleetFilters = {
    q: one(searchParams.q),
    category: CATS.includes(one(searchParams.category)) ? one(searchParams.category) : undefined,
    transmission: ["automatic", "manual"].includes(one(searchParams.transmission)) ? one(searchParams.transmission) : undefined,
    availableOnly: one(searchParams.available) === "1",
    sort: (one(searchParams.sort) in SORTS ? one(searchParams.sort) : "featured") as FleetFilters["sort"],
  };
  const dates = { pickupDate: one(searchParams.pickupDate), pickupTime: one(searchParams.pickupTime) || "10:00", returnDate: one(searchParams.returnDate), returnTime: one(searchParams.returnTime) || "10:00" };
  const hasDates = Boolean(dates.pickupDate && dates.returnDate);
  const window = hasDates ? checkRentalWindow(dates, s.regional.timezone, s.booking) : null;

  const [{ data: vehicles, failed }, busy] = await Promise.all([
    safeRead("fleet.list", () => listVehicles(f), []),
    window?.ok ? safeRead("fleet.busy", () => busyVehicleIds(window.pickupAt, window.returnAt), new Set<number>()).then((r) => r.data) : Promise.resolve(new Set<number>()),
  ]);

  const stateOf = (id: number, isAvailable: boolean): CardAvailability => (!isAvailable ? "unavailable" : busy.has(id) ? "booked" : "available");
  let shown = vehicles;
  if (f.availableOnly) shown = vehicles.filter((v) => stateOf(v.id, v.isAvailable) === "available");
  const dateQuery = window?.ok ? `?${new URLSearchParams(dates).toString()}` : "";

  return (
    <div className="page pb-10 pt-[calc(var(--header-h)+3rem)]">
      <h1 className="h1">Our fleet</h1>
      <p className="lede mt-5">Daily prices in {s.regional.currency}. Choose dates to see what&apos;s free when you need it.</p>

      <AutoSubmitForm label="Filter cars" className="glass cut mt-10 grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="f-q">Search</label>
          <input id="f-q" className="input" type="search" name="q" defaultValue={f.q} placeholder="Brand or model" maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="f-c">Type</label>
          <select id="f-c" className="input" name="category" defaultValue={f.category ?? ""}>
            <option value="">All types</option>
            {CATS.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-t">Transmission</label>
          <select id="f-t" className="input" name="transmission" defaultValue={f.transmission ?? ""}>
            <option value="">Any</option><option value="automatic">Automatic</option><option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-s">Sort by</label>
          <select id="f-s" className="input" name="sort" defaultValue={f.sort}>
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 lg:pb-3">
          <input id="f-a" type="checkbox" name="available" value="1" defaultChecked={f.availableOnly} className="h-5 w-5 accent-brand" />
          <label htmlFor="f-a">Available only</label>
        </div>
        <fieldset className="grid gap-4 border-t border-cream/10 pt-4 sm:grid-cols-4 md:col-span-2 lg:col-span-5">
          <legend className="sr-only">Rental dates</legend>
          <div><label className="label" htmlFor="f-pd">Pickup date</label><input id="f-pd" className="input" type="date" name="pickupDate" defaultValue={dates.pickupDate} /></div>
          <div><label className="label" htmlFor="f-pt">Pickup time</label><input id="f-pt" className="input" type="time" name="pickupTime" defaultValue={dates.pickupTime} step={900} /></div>
          <div><label className="label" htmlFor="f-rd">Return date</label><input id="f-rd" className="input" type="date" name="returnDate" defaultValue={dates.returnDate} /></div>
          <div><label className="label" htmlFor="f-rt">Return time</label><input id="f-rt" className="input" type="time" name="returnTime" defaultValue={dates.returnTime} step={900} /></div>
        </fieldset>
        <div className="flex gap-2 lg:col-span-1 lg:self-end">
          <button className="btn-primary flex-1" type="submit">Update</button>
          <Link href="/fleet" className="btn-ghost px-4" aria-label="Clear filters">Clear</Link>
        </div>
      </AutoSubmitForm>

      <div className="mt-8 min-h-[1.5rem] text-cream/70" aria-live="polite">
        {window && !window.ok && <p className="text-bad">{window.error}</p>}
        {window?.ok && <p>Showing availability for {formatDateTime(window.pickupAt, s.regional.timezone)} to {formatDateTime(window.returnAt, s.regional.timezone)}.</p>}
        {!failed && <p>{shown.length} {shown.length === 1 ? "car" : "cars"} found</p>}
      </div>

      {failed ? (
        <div className="mt-6"><StatusNote tone="error" title="We couldn't load the fleet right now.">Refresh in a moment, or <Link className="underline" href="/contact">contact us</Link>.</StatusNote></div>
      ) : shown.length === 0 ? (
        <div className="mt-6"><StatusNote title="No cars match these filters.">Try another type or different dates, or <Link href="/fleet" className="underline">clear all filters</Link>.</StatusNote></div>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v, i) => (
            <VehicleCard key={v.id} v={v} query={dateQuery} priority={i < 3} whatsapp={s.business.whatsapp} businessName={s.business.name} availability={stateOf(v.id, v.isAvailable)} />
          ))}
        </div>
      )}
    </div>
  );
}
