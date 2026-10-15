"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { saveVehicleAction } from "@/app/admin/actions";
import { Submit, Message } from "@/components/admin/forms";
import { categoryLabels, slugify } from "@/lib/format";

type V = { id?: number; brand: string; model: string; year: number; slug: string; category: string; transmission: string; seats: number; fuelType: string | null; dailyRate: number; deposit: number; summary: string; description: string; features: string[]; isAvailable: boolean; isFeatured: boolean; seoTitle: string | null; seoDescription: string | null };

export function VehicleForm({ v }: { v?: V }) {
  const [state, action] = useFormState(saveVehicleAction, {});
  const [brand, setBrand] = useState(v?.brand ?? "");
  const [model, setModel] = useState(v?.model ?? "");
  const [slug, setSlug] = useState(v?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(v));
  const auto = (b: string, m: string) => { if (!slugTouched) setSlug(slugify(`${b} ${m}`)); };
  const e = (k: string) => state.fields?.[k] && <p className="err">{state.fields[k]}</p>;
  const inv = (k: string) => (state.fields?.[k] ? true : undefined);

  return (
    <form action={action} className="grid max-w-4xl gap-5 sm:grid-cols-2">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <div><label className="label" htmlFor="v-b">Brand</label><input id="v-b" name="brand" className="input" required value={brand} aria-invalid={inv("brand")} onChange={(ev) => { setBrand(ev.target.value); auto(ev.target.value, model); }} />{e("brand")}</div>
      <div><label className="label" htmlFor="v-m">Model</label><input id="v-m" name="model" className="input" required value={model} aria-invalid={inv("model")} onChange={(ev) => { setModel(ev.target.value); auto(brand, ev.target.value); }} />{e("model")}</div>
      <div><label className="label" htmlFor="v-y">Year</label><input id="v-y" name="year" type="number" className="input" required defaultValue={v?.year ?? new Date().getFullYear()} aria-invalid={inv("year")} />{e("year")}</div>
      <div><label className="label" htmlFor="v-s">Page address</label><input id="v-s" name="slug" className="input" required value={slug} aria-invalid={inv("slug")} onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value); }} /><p className="hint">/fleet/{slug || "…"}</p>{e("slug")}</div>
      <div><label className="label" htmlFor="v-c">Category</label><select id="v-c" name="category" className="input" defaultValue={v?.category ?? "economy"}>{Object.entries(categoryLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div><label className="label" htmlFor="v-t">Transmission</label><select id="v-t" name="transmission" className="input" defaultValue={v?.transmission ?? "automatic"}><option value="automatic">Automatic</option><option value="manual">Manual</option></select></div>
      <div><label className="label" htmlFor="v-se">Seats</label><input id="v-se" name="seats" type="number" min={1} max={60} className="input" required defaultValue={v?.seats ?? 5} aria-invalid={inv("seats")} />{e("seats")}</div>
      <div><label className="label" htmlFor="v-f">Fuel type (optional)</label><input id="v-f" name="fuelType" className="input" defaultValue={v?.fuelType ?? ""} placeholder="Petrol, Diesel, Hybrid…" /></div>
      <div><label className="label" htmlFor="v-r">Daily rate (QAR)</label><input id="v-r" name="dailyRate" type="number" min={1} step={1} className="input" required defaultValue={v?.dailyRate ?? ""} aria-invalid={inv("dailyRate")} />{e("dailyRate")}</div>
      <div><label className="label" htmlFor="v-d">Security deposit (QAR)</label><input id="v-d" name="deposit" type="number" min={0} step={1} className="input" defaultValue={v?.deposit ?? 0} aria-invalid={inv("deposit")} />{e("deposit")}</div>
      <div className="sm:col-span-2"><label className="label" htmlFor="v-su">Short summary (shown on cards)</label><input id="v-su" name="summary" className="input" maxLength={300} defaultValue={v?.summary ?? ""} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="v-de">Description</label><textarea id="v-de" name="description" rows={5} className="input" maxLength={5000} defaultValue={v?.description ?? ""} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="v-fe">Features (one per line)</label><textarea id="v-fe" name="features" rows={5} className="input" defaultValue={(v?.features ?? []).join("\n")} />{e("features")}</div>
      <label className="flex items-center gap-3"><input type="checkbox" name="isAvailable" defaultChecked={v?.isAvailable ?? true} className="h-5 w-5 accent-brand" />Taking bookings</label>
      <label className="flex items-center gap-3"><input type="checkbox" name="isFeatured" defaultChecked={v?.isFeatured ?? false} className="h-5 w-5 accent-brand" />Feature on the homepage</label>
      <fieldset className="grid gap-5 border-t border-cream/10 pt-5 sm:col-span-2">
        <legend className="h3 mb-2">Search engine listing (optional)</legend>
        <div><label className="label" htmlFor="v-st">Page title</label><input id="v-st" name="seoTitle" className="input" maxLength={120} defaultValue={v?.seoTitle ?? ""} placeholder={`Rent a ${brand || "…"} ${model} in Qatar`} /></div>
        <div><label className="label" htmlFor="v-sd">Description</label><textarea id="v-sd" name="seoDescription" rows={2} className="input" maxLength={300} defaultValue={v?.seoDescription ?? ""} /></div>
      </fieldset>
      <div className="flex items-center gap-4 sm:col-span-2"><Submit className="btn-primary">{v?.id ? "Save changes" : "Add car"}</Submit><Message state={state} /></div>
    </form>
  );
}
