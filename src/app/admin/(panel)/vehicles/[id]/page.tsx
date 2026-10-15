import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getVehicleById } from "@/server/vehicles";
import { listBlocked } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { archiveVehicleAction, imageAction, removeBlockAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import { dateKeyInZone } from "@/lib/time";
import { SafeImage } from "@/components/SafeImage";
import { VehicleForm } from "../VehicleForm";
import { UploadForm, UrlForm, BlockForm, DeleteForm } from "./Managers";

export default async function EditVehicle({ params, searchParams }: { params: { id: string }; searchParams: { created?: string } }) {
  const admin = await requireAdmin();
  const id = Number(params.id);
  if (!Number.isSafeInteger(id)) notFound();
  const [v, blocks, s] = await Promise.all([getVehicleById(id), listBlocked(id), getSettings()]);
  if (!v) notFound();
  const tz = s.regional.timezone;
  return (
    <>
      <Link href="/admin/vehicles" className="text-sm text-cream/60 hover:text-cream">← Vehicles</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="h2">{v.year} {v.brand} {v.model}</h1>
        {!v.archivedAt && <Link href={`/fleet/${v.slug}`} target="_blank" className="btn-ghost btn-sm">View on website</Link>}
      </div>
      {searchParams.created && <p role="status" className="mt-4 text-ok">Car added. Now add some photos.</p>}
      {v.archivedAt && <p className="mt-4 text-warn">This car is archived and hidden from the website.</p>}

      <section className="mt-10"><h2 className="h3 mb-6">Details</h2><VehicleForm v={v} /></section>

      <section className="mt-14 border-t border-cream/10 pt-10">
        <h2 className="h3 mb-6">Photos</h2>
        {v.images.length === 0 ? <p className="text-cream/60">No photos yet.</p> : (
          <ul className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {v.images.map((img, i) => (
              <li key={img.id} className="panel cut cut-sm overflow-hidden">
                <div className="relative aspect-[4/3]"><SafeImage src={img.src} alt={img.alt} fill sizes="300px" className="object-cover" /></div>
                <div className="flex gap-2 p-3">
                  {i === 0 ? <span className="chip bg-brand/40">Main photo</span> : (
                    <form action={imageAction}><input type="hidden" name="vehicleId" value={v.id} /><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="op" value="primary" /><button className="text-sm underline">Make main</button></form>
                  )}
                  <form action={imageAction} className="ml-auto"><input type="hidden" name="vehicleId" value={v.id} /><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="op" value="delete" /><button className="text-sm text-bad underline">Remove</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 grid max-w-4xl gap-10 md:grid-cols-2"><UploadForm vehicleId={v.id} /><UrlForm vehicleId={v.id} /></div>
      </section>

      <section className="mt-14 max-w-4xl border-t border-cream/10 pt-10">
        <h2 className="h3">Blocked dates</h2>
        <p className="mb-6 mt-2 text-cream/60">Customers can&apos;t book the car during these periods. Times are in {tz}.</p>
        {blocks.length > 0 && (
          <ul className="mb-8 divide-y divide-cream/10 border-y border-cream/10">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{formatDateTime(b.starts_at, tz)} to {formatDateTime(b.ends_at, tz)}{b.reason && <span className="text-cream/60">, {b.reason}</span>}</span>
                <form action={removeBlockAction}><input type="hidden" name="vehicleId" value={v.id} /><input type="hidden" name="blockId" value={b.id} /><button className="text-sm underline">Unblock</button></form>
              </li>
            ))}
          </ul>
        )}
        <BlockForm vehicleId={v.id} today={dateKeyInZone(new Date(), tz)} />
      </section>

      <section className="mt-14 max-w-4xl border-t border-cream/10 pt-10">
        <h2 className="h3">Remove from the website</h2>
        <p className="mb-5 mt-2 text-cream/60">Archiving hides the car but keeps its booking history. You can restore it at any time.</p>
        <form action={archiveVehicleAction}>
          <input type="hidden" name="id" value={v.id} /><input type="hidden" name="archive" value={v.archivedAt ? "0" : "1"} />
          <button className="btn-ghost btn-sm">{v.archivedAt ? "Restore to website" : "Archive car"}</button>
        </form>
        {admin.role === "owner" && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-cream/60">Permanent deletion is only possible for cars that have never been booked.</p>
            <DeleteForm vehicleId={v.id} />
          </div>
        )}
      </section>
    </>
  );
}
