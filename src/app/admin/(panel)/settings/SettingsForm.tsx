"use client";
import { useFormState } from "react-dom";
import { saveSettingsAction } from "@/app/admin/actions";
import { Submit, Message } from "@/components/admin/forms";
import type { SiteSettings } from "@/lib/settings-schema";
import { formatBlocks, formatLocations, formatPairs } from "@/lib/settings-form";

type FieldProps = { name: string; label: string; def: string | number; hint?: string; type?: string; rows?: number; err?: string };
function Field({ name, label, def, hint, type = "text", rows, err }: FieldProps) {
  const id = `s-${name}`;
  return (
    <div className={rows ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={id}>{label}</label>
      {rows ? <textarea id={id} name={name} rows={rows} defaultValue={String(def)} className="input font-[inherit]" aria-invalid={err ? true : undefined} />
        : <input id={id} name={name} type={type} defaultValue={String(def)} className="input" aria-invalid={err ? true : undefined} step={type === "number" ? "any" : undefined} />}
      {hint && <p className="hint">{hint}</p>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
function Toggle({ name, label, def }: { name: string; label: string; def: boolean }) {
  return <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" name={name} defaultChecked={def} className="h-5 w-5 accent-brand" />{label}</label>;
}
function Group({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <fieldset className="grid gap-5 border-t border-cream/10 pt-8 sm:grid-cols-2">
      <legend className="h3 mb-2">{title}</legend>
      {note && <p className="-mt-2 text-cream/60 sm:col-span-2">{note}</p>}
      {children}
    </fieldset>
  );
}

const POLICY_LABELS: Record<string, string> = {
  deposit: "Security deposit", mileage: "Mileage limits and extra mileage", fuel: "Fuel policy", cancellation: "Cancellation and refunds",
  modification: "Changing a booking", lateReturn: "Late returns", insurance: "Insurance", licence: "Licence and ID requirements",
  additionalDrivers: "Additional drivers", delivery: "Delivery and collection", taxes: "Taxes and fees",
};

export function SettingsForm({ s }: { s: SiteSettings }) {
  const [state, action] = useFormState(saveSettingsAction, {});
  const e = (k: string) => state.fields?.[k];
  return (
    <form action={action} className="max-w-4xl space-y-10">
      <Group title="Business and contact">
        <Field name="business.name" label="Business name" def={s.business.name} err={e("business.name")} />
        <Field name="business.shortName" label="Short name" def={s.business.shortName} err={e("business.shortName")} />
        <Field name="business.phone" label="Phone" def={s.business.phone} err={e("business.phone")} />
        <Field name="business.email" label="Email" def={s.business.email} type="email" err={e("business.email")} />
        <Field name="business.whatsapp" label="WhatsApp number" def={s.business.whatsapp} hint="Digits only with country code, e.g. 974XXXXXXXX. Leave empty to hide WhatsApp buttons." err={e("business.whatsapp")} />
        <Field name="business.instagram" label="Instagram link" def={s.business.instagram} err={e("business.instagram")} />
        <Field name="business.address" label="Location" def={s.business.address} err={e("business.address")} />
        <Field name="business.mapsUrl" label="Google Maps link (optional)" def={s.business.mapsUrl} err={e("business.mapsUrl")} />
        <Field name="business.established" label="Year established" def={s.business.established} />
        <Field name="business.tagline" label="Tagline" def={s.business.tagline} />
        <Field name="business.description" label="Short description" def={s.business.description} rows={3} />
        <Field name="business.hours" label="Opening hours" def={formatPairs(s.business.hours)} rows={3} hint="One per line: Days | Hours" err={e("business.hours")} />
      </Group>

      <Group title="Booking rules" note={`Times use the ${s.regional.timezone} timezone. Prices are in ${s.regional.currency}.`}>
        <Toggle name="booking.requireApproval" label="Review each request before it's confirmed (recommended)" def={s.booking.requireApproval} />
        <Field name="booking.graceMinutes" label="Grace period before an extra day (minutes)" def={s.booking.graceMinutes} type="number" err={e("booking.graceMinutes")} />
        <Field name="booking.minDays" label="Minimum rental (days)" def={s.booking.minDays} type="number" err={e("booking.minDays")} />
        <Field name="booking.maxDays" label="Maximum online rental (days)" def={s.booking.maxDays} type="number" err={e("booking.maxDays")} />
        <Field name="booking.minLeadHours" label="Minimum notice before pickup (hours)" def={s.booking.minLeadHours} type="number" err={e("booking.minLeadHours")} />
        <Field name="booking.maxAdvanceDays" label="How far ahead customers can book (days)" def={s.booking.maxAdvanceDays} type="number" err={e("booking.maxAdvanceDays")} />
        <Field name="booking.additionalDriverPerDay" label="Additional driver fee per day" def={s.booking.additionalDriverPerDay} type="number" err={e("booking.additionalDriverPerDay")} />
        <Field name="booking.taxPercent" label="Tax (%)" def={s.booking.taxPercent} type="number" hint="Leave at 0 unless you've confirmed a tax applies." err={e("booking.taxPercent")} />
        <Field name="booking.locations" label="Pickup and return locations" def={formatLocations(s.booking.locations)} rows={4} hint="One per line: id | Name | Fee. The id must stay the same once bookings use it." err={Object.entries(state.fields ?? {}).find(([k]) => k.startsWith("booking.locations"))?.[1]} />
      </Group>

      <Group title="Payments" note="Online card payments aren't connected yet. They need a payment provider account (see the README).">
        <Toggle name="payments.payOnArrival" label="Offer pay on arrival" def={s.payments.payOnArrival} />
        <Toggle name="payments.arrangeWithTeam" label="Offer arranging payment with the team after confirmation" def={s.payments.arrangeWithTeam} />
        <Field name="payments.note" label="Payment note shown on the booking form" def={s.payments.note} rows={2} />
      </Group>

      <Group title="Rental policies" note="Check every policy against current Qatar regulations before launch. Shown on the Rental policies page and vehicle pages.">
        <Field name="policies.minDriverAge" label="Minimum driver age" def={s.policies.minDriverAge} type="number" err={e("policies.minDriverAge")} />
        <div className="hidden sm:block" />
        {Object.entries(POLICY_LABELS).map(([k, l]) => <Field key={k} name={`policies.${k}`} label={l} def={(s.policies as Record<string, string | number>)[k]} rows={3} />)}
      </Group>

      <Group title="Homepage">
        <Field name="homepage.heroHeadline" label="Headline" def={s.homepage.heroHeadline} hint="Sentences ending in a full stop appear on separate lines." err={e("homepage.heroHeadline")} />
        <Field name="homepage.heroSubtext" label="Supporting text" def={s.homepage.heroSubtext} />
        <Field name="homepage.heroImage" label="Hero image link" def={s.homepage.heroImage} />
        <Field name="homepage.eventsImage" label="Weddings and events image link" def={s.homepage.eventsImage} />
        <Field name="homepage.eventsTitle" label="Weddings and events heading (empty hides the section)" def={s.homepage.eventsTitle} />
        <Field name="homepage.eventsText" label="Weddings and events text" def={s.homepage.eventsText} rows={2} />
        <Field name="homepage.faqs" label="FAQ" def={formatBlocks(s.homepage.faqs.map((f) => ({ head: f.q, body: f.a })))} rows={10} hint="Question on the first line, answer below it. Leave a blank line between questions." err={Object.entries(state.fields ?? {}).find(([k]) => k.startsWith("homepage.faqs"))?.[1]} />
        <Field name="homepage.reviews" label="Customer reviews" def={formatBlocks(s.homepage.reviews.map((r) => ({ head: r.source ? `${r.name} | ${r.source}` : r.name, body: r.text })))} rows={6} hint="Only add genuine reviews you have permission to publish. First line: Name | Source (e.g. Google). Review text below. Blank line between reviews. The section stays hidden while this is empty." err={Object.entries(state.fields ?? {}).find(([k]) => k.startsWith("homepage.reviews"))?.[1]} />
      </Group>

      <Group title="About page">
        <Field name="about.intro" label="Introduction" def={s.about.intro} rows={2} />
        <Field name="about.story" label="Your story" def={s.about.story} rows={6} hint="Leave a blank line between paragraphs." />
        <Field name="about.services" label="Services" def={formatBlocks(s.about.services.map((x) => ({ head: x.title, body: x.text })))} rows={7} hint="Title on the first line, description below. Blank line between services." />
      </Group>

      <Group title="Search engines">
        <Field name="seo.defaultTitle" label="Default page title" def={s.seo.defaultTitle} err={e("seo.defaultTitle")} />
        <Field name="seo.ogImage" label="Social sharing image" def={s.seo.ogImage} />
        <Field name="seo.defaultDescription" label="Default description" def={s.seo.defaultDescription} rows={2} />
      </Group>

      <div className="sticky bottom-0 -mx-5 flex items-center gap-4 border-t border-cream/10 bg-ink/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Submit className="btn-primary">Save settings</Submit>
        <Message state={state} />
      </div>
    </form>
  );
}
