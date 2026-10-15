"use client";
import { useState } from "react";
import { addDaysToKey } from "@/lib/time";

type Props = { defaults: { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string; today: string }; categories: { value: string; label: string }[] };

/** Plain GET form so it works before JavaScript loads; JS only keeps the return date after pickup. */
export function QuickSearch({ defaults, categories }: Props) {
  const [pickupDate, setPickupDate] = useState(defaults.pickupDate);
  const [returnDate, setReturnDate] = useState(defaults.returnDate);
  return (
    <form action="/fleet" method="get" className="glass cut grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_0.7fr_1fr_0.7fr_1fr_auto] lg:items-end lg:p-6" aria-label="Find a car">
      <div>
        <label className="label" htmlFor="qs-pd">Pickup date</label>
        <input id="qs-pd" className="input" type="date" name="pickupDate" min={defaults.today} value={pickupDate} required
          onChange={(e) => { setPickupDate(e.target.value); if (e.target.value >= returnDate) setReturnDate(addDaysToKey(e.target.value, 1)); }} />
      </div>
      <div>
        <label className="label" htmlFor="qs-pt">Time</label>
        <input id="qs-pt" className="input" type="time" name="pickupTime" defaultValue={defaults.pickupTime} step={900} required />
      </div>
      <div>
        <label className="label" htmlFor="qs-rd">Return date</label>
        <input id="qs-rd" className="input" type="date" name="returnDate" min={pickupDate} value={returnDate} required onChange={(e) => setReturnDate(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="qs-rt">Time</label>
        <input id="qs-rt" className="input" type="time" name="returnTime" defaultValue={defaults.returnTime} step={900} required />
      </div>
      <div>
        <label className="label" htmlFor="qs-cat">Car type</label>
        <select id="qs-cat" className="input" name="category" defaultValue="">
          <option value="">Any type</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-1">Find cars</button>
    </form>
  );
}
