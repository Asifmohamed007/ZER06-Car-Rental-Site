"use client";
import { useEffect, useState } from "react";

type Props = { slug: string; today: string };

/** Month view of unavailable days. Display only: availability is re-checked on the server when you book. */
export function AvailabilityCalendar({ slug, today }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [busy, setBusy] = useState<Set<string> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctl = new AbortController();
    setBusy(null); setFailed(false);
    fetch(`/api/availability?vehicle=${encodeURIComponent(slug)}&month=${month}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setBusy(new Set(d.busy)))
      .catch((e) => { if (e?.name !== "AbortError") setFailed(true); });
    return () => ctl.abort();
  }, [slug, month]);

  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const label = first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const shift = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); };
  const canBack = month > today.slice(0, 7);

  return (
    <div className="panel cut p-5">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canBack} className="grid h-10 w-10 place-items-center disabled:opacity-30" aria-label="Previous month">‹</button>
        <h3 className="font-display text-xl font-semibold" aria-live="polite">{label}</h3>
        <button type="button" onClick={() => shift(1)} className="grid h-10 w-10 place-items-center" aria-label="Next month">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-cream/50" aria-hidden>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <ul className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: lead }).map((_, i) => <li key={`l${i}`} aria-hidden />)}
        {Array.from({ length: daysIn }).map((_, i) => {
          const key = `${month}-${String(i + 1).padStart(2, "0")}`;
          const past = key < today;
          const isBusy = busy?.has(key);
          const state = past ? "Past" : busy === null ? "Loading" : isBusy ? "Unavailable" : "Available";
          return (
            <li key={key} aria-label={`${key}: ${state}`}
              className={`rounded-sm py-2 text-sm ${past ? "text-cream/25" : isBusy ? "bg-bad/15 text-cream/40 line-through" : busy ? "bg-ok/10 text-cream" : "text-cream/40"}`}>
              {i + 1}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-cream/60">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-ok/30" aria-hidden />Free</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-bad/30" aria-hidden />Booked or blocked (fully or partly)</span>
      </div>
      {failed && <p className="mt-3 text-sm text-bad">The calendar didn&apos;t load. You can still pick dates: we check availability when you request a price.</p>}
    </div>
  );
}
