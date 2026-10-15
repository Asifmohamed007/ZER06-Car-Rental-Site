"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDaysToKey } from "@/lib/time";
import { formatMoney } from "@/lib/format";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import type { Quote } from "@/lib/pricing";
import { WaIcon } from "./WhatsAppButton";

type Location = { id: string; name: string; fee: number };
type Props = {
  vehicle: { slug: string; name: string; isAvailable: boolean };
  locations: Location[];
  payments: { payOnArrival: boolean; arrangeWithTeam: boolean; note: string };
  minDriverAge: number;
  requireApproval: boolean;
  currency: string;
  businessName: string;
  whatsapp: string;
  today: string;
  initial: { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string };
};

type QuoteState =
  | { kind: "idle" | "loading" }
  | { kind: "ok"; quote: Quote; available: boolean; reason?: string }
  | { kind: "error"; message: string; fields?: Record<string, string> };

function newKey() {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const pretty = (date: string, time: string) => {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}, ${time}`;
};

export function BookingPanel(p: Props) {
  const router = useRouter();
  const [w, setW] = useState(p.initial);
  const [pickupLocation, setPickupLocation] = useState(p.locations[0]?.id ?? "");
  const [returnLocation, setReturnLocation] = useState(p.locations[0]?.id ?? "");
  const [additionalDriver, setAdditionalDriver] = useState(false);
  const [quote, setQuote] = useState<QuoteState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const keyRef = useRef<string>("");
  if (!keyRef.current) keyRef.current = newKey();

  const quoteBody = useMemo(() => ({ vehicleSlug: p.vehicle.slug, ...w, pickupLocation, returnLocation, additionalDriver }), [p.vehicle.slug, w, pickupLocation, returnLocation, additionalDriver]);

  useEffect(() => {
    if (!w.pickupDate || !w.returnDate || !w.pickupTime || !w.returnTime) { setQuote({ kind: "idle" }); return; }
    const ctl = new AbortController();
    setQuote({ kind: "loading" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quoteBody), signal: ctl.signal });
        const data = await res.json();
        if (!res.ok) setQuote({ kind: "error", message: data.error ?? "We couldn't price these dates.", fields: data.fields });
        else setQuote({ kind: "ok", quote: data.quote, available: data.available, reason: data.reason });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setQuote({ kind: "error", message: "We couldn't reach the server. Check your connection and try again." });
      }
    }, 300);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [quoteBody, w]);

  const set = (k: keyof typeof w) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setW((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "pickupDate" && v && next.returnDate && v > next.returnDate) next.returnDate = addDaysToKey(v, 1);
      return next;
    });
  };

  const locName = (id: string) => p.locations.find((l) => l.id === id)?.name ?? "";
  const estimate = quote.kind === "ok" ? formatMoney(quote.quote.total, p.currency) : undefined;
  const wa = whatsappLink(p.whatsapp, buildWhatsAppMessage({
    businessName: p.businessName, vehicleName: p.vehicle.name,
    pickup: pretty(w.pickupDate, w.pickupTime), return: pretty(w.returnDate, w.returnTime),
    location: pickupLocation === returnLocation ? locName(pickupLocation) : `${locName(pickupLocation)} (pickup), ${locName(returnLocation)} (return)`,
    estimate: estimate ? `${estimate} (website estimate)` : undefined,
  }));

  const canSubmit = p.vehicle.isAvailable && quote.kind === "ok" && quote.available && !submitting;
  const dateErr = quote.kind === "error" ? quote.fields?.pickupDate ?? quote.fields?.returnDate ?? quote.message : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const body = {
      ...quoteBody,
      idempotencyKey: keyRef.current,
      customerName: String(fd.get("customerName") ?? ""),
      customerPhone: String(fd.get("customerPhone") ?? ""),
      customerEmail: String(fd.get("customerEmail") ?? ""),
      driverAge: Number(fd.get("driverAge") || 0),
      notes: String(fd.get("notes") ?? ""),
      paymentMethod: String(fd.get("paymentMethod") ?? ""),
      acceptPolicies: fd.get("acceptPolicies") === "on",
      website: String(fd.get("website") ?? ""),
    };
    setSubmitting(true); setSubmitError(null); setFields({});
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reference) {
        router.push(`/booking/${encodeURIComponent(data.reference)}?t=${encodeURIComponent(keyRef.current)}`);
        return; // keep the button disabled while navigating
      }
      setFields(data.fields ?? {});
      setSubmitError(data.error ?? "We couldn't send your request. Please try again.");
      if (res.status === 409) setQuote((q) => (q.kind === "ok" ? { ...q, available: false, reason: data.error } : q));
      setSubmitting(false);
    } catch {
      setSubmitError("We couldn't reach the server. Your request was not sent. Check your connection and try again.");
      setSubmitting(false); // same idempotency key is reused, so a retry can't create a duplicate
    }
  }

  const err = (k: string) => fields[k] ? <p className="err" id={`${k}-err`}>{fields[k]}</p> : null;
  const aria = (k: string) => ({ "aria-invalid": fields[k] ? true : undefined, "aria-describedby": fields[k] ? `${k}-err` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8" aria-label={`Book the ${p.vehicle.name}`}>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="h3 mb-4">When and where</legend>
        <div><label className="label" htmlFor="b-pd">Pickup date</label><input id="b-pd" className="input" type="date" required min={p.today} value={w.pickupDate} onChange={set("pickupDate")} /></div>
        <div><label className="label" htmlFor="b-pt">Pickup time</label><input id="b-pt" className="input" type="time" required step={900} value={w.pickupTime} onChange={set("pickupTime")} /></div>
        <div><label className="label" htmlFor="b-rd">Return date</label><input id="b-rd" className="input" type="date" required min={w.pickupDate || p.today} value={w.returnDate} onChange={set("returnDate")} /></div>
        <div><label className="label" htmlFor="b-rt">Return time</label><input id="b-rt" className="input" type="time" required step={900} value={w.returnTime} onChange={set("returnTime")} /></div>
        <div>
          <label className="label" htmlFor="b-pl">Pickup location</label>
          <select id="b-pl" className="input" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)}>
            {p.locations.map((l) => <option key={l.id} value={l.id}>{l.name}{l.fee ? ` (+${formatMoney(l.fee, p.currency)})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="b-rl">Return location</label>
          <select id="b-rl" className="input" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)}>
            {p.locations.map((l) => <option key={l.id} value={l.id}>{l.name}{l.fee ? ` (+${formatMoney(l.fee, p.currency)})` : ""}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={additionalDriver} onChange={(e) => setAdditionalDriver(e.target.checked)} />
          Add an additional driver
        </label>
      </fieldset>

      <section aria-live="polite" aria-label="Price" className="cut cut-sm bg-ink/60 p-5 ring-1 ring-inset ring-cream/10">
        {quote.kind === "idle" && <p className="text-cream/60">Choose your dates to see the price.</p>}
        {quote.kind === "loading" && <p className="text-cream/60">Checking price and availability…</p>}
        {quote.kind === "error" && <p className="text-bad" role="alert">{dateErr}</p>}
        {quote.kind === "ok" && (
          <>
            <dl className="space-y-2">
              {quote.quote.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-4 text-cream/80"><dt>{l.label}</dt><dd>{formatMoney(l.amount, p.currency)}</dd></div>
              ))}
              {quote.quote.tax > 0 && <div className="flex justify-between gap-4 text-cream/80"><dt>Tax</dt><dd>{formatMoney(quote.quote.tax, p.currency)}</dd></div>}
              <div className="flex justify-between gap-4 border-t border-cream/15 pt-3 font-display text-2xl font-bold"><dt>Estimated total</dt><dd>{formatMoney(quote.quote.total, p.currency)}</dd></div>
              {quote.quote.deposit > 0 && <div className="flex justify-between gap-4 text-sm text-cream/60"><dt>Refundable security deposit (not included)</dt><dd>{formatMoney(quote.quote.deposit, p.currency)}</dd></div>}
            </dl>
            {!quote.available && <p className="mt-4 text-warn" role="alert">{quote.reason} Try other dates, or ask us on WhatsApp.</p>}
          </>
        )}
      </section>

      {!p.vehicle.isAvailable ? (
        <p className="text-warn">This car isn&apos;t taking online bookings right now. Message us to ask about it.</p>
      ) : (
        <fieldset className="grid gap-4 sm:grid-cols-2" disabled={submitting}>
          <legend className="h3 mb-4">Your details</legend>
          <div className="sm:col-span-2"><label className="label" htmlFor="b-n">Full name</label><input id="b-n" name="customerName" className="input" autoComplete="name" required maxLength={120} {...aria("customerName")} />{err("customerName")}</div>
          <div><label className="label" htmlFor="b-ph">Phone</label><input id="b-ph" name="customerPhone" className="input" type="tel" autoComplete="tel" required placeholder="+974" maxLength={20} {...aria("customerPhone")} />{err("customerPhone")}</div>
          <div><label className="label" htmlFor="b-e">Email</label><input id="b-e" name="customerEmail" className="input" type="email" autoComplete="email" required maxLength={200} {...aria("customerEmail")} />{err("customerEmail")}</div>
          <div><label className="label" htmlFor="b-a">Driver&apos;s age</label><input id="b-a" name="driverAge" className="input" type="number" inputMode="numeric" min={p.minDriverAge} max={99} required {...aria("driverAge")} /><p className="hint">Minimum age {p.minDriverAge}.</p>{err("driverAge")}</div>
          <div className="sm:col-span-2"><label className="label" htmlFor="b-no">Anything we should know? (optional)</label><textarea id="b-no" name="notes" className="input" rows={3} maxLength={1000} placeholder="Flight number, delivery address, event details…" /></div>
          <fieldset className="sm:col-span-2">
            <legend className="label">Payment</legend>
            <div className="space-y-2">
              {p.payments.payOnArrival && <label className="flex items-center gap-3"><input type="radio" name="paymentMethod" value="pay_on_arrival" defaultChecked className="h-5 w-5 accent-brand" />Pay on arrival</label>}
              {p.payments.arrangeWithTeam && <label className="flex items-center gap-3"><input type="radio" name="paymentMethod" value="arrange_with_team" defaultChecked={!p.payments.payOnArrival} className="h-5 w-5 accent-brand" />Arrange payment with the team after confirmation</label>}
            </div>
            {p.payments.note && <p className="hint">{p.payments.note}</p>}
            {err("paymentMethod")}
          </fieldset>
          <div className="hidden" aria-hidden><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="checkbox" name="acceptPolicies" required className="mt-1 h-5 w-5 accent-brand" {...aria("acceptPolicies")} />
            <span>I have read the <Link href="/policies" target="_blank" className="underline underline-offset-4">rental policies</Link> and will bring a valid driving licence and ID.</span>
          </label>
          {err("acceptPolicies")}
        </fieldset>
      )}

      {submitError && <p role="alert" className="text-bad">{submitError}</p>}

      <div className="flex flex-col gap-3">
        {p.vehicle.isAvailable && (
          <button type="submit" className="btn-primary flex-1" disabled={!canSubmit} aria-busy={submitting}>
            {submitting ? "Sending request…" : p.requireApproval ? "Send booking request" : "Book now"}
          </button>
        )}
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1"><WaIcon />Book via WhatsApp</a>
        ) : (
          <Link href="/contact" className="btn-ghost flex-1">Contact us instead</Link>
        )}
      </div>
      <p className="text-sm text-cream/55">
        {p.requireApproval
          ? "Sending a request doesn't confirm your booking. We'll check it and confirm with you directly."
          : "Your booking is confirmed when you send it, subject to the rental policies."}{" "}
        WhatsApp messages are enquiries, not reservations.
      </p>
    </form>
  );
}
