import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { listAllVehiclesForAdmin } from "@/server/vehicles";
import { categoryLabels, formatMoney } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export default async function VehiclesAdmin({ searchParams }: { searchParams: { archived?: string; deleted?: string } }) {
  await requireAdmin();
  const showArchived = searchParams.archived === "1";
  const rows = await listAllVehiclesForAdmin(showArchived);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h2">Vehicles</h1>
        <div className="flex gap-3">
          <Link href={showArchived ? "?" : "?archived=1"} className="btn-ghost btn-sm">{showArchived ? "Hide archived" : "Show archived"}</Link>
          <Link href="/admin/vehicles/new" className="btn-primary btn-sm">Add a car</Link>
        </div>
      </div>
      {searchParams.deleted && <p role="status" className="mt-4 text-ok">Car deleted.</p>}
      {rows.length === 0 ? <p className="mt-8 text-cream/60">No cars yet. Add your first car to show it on the website.</p> : (
        <ul className="mt-6 divide-y divide-cream/10 border-y border-cream/10">
          {rows.map((v) => (
            <li key={v.id}>
              <Link href={`/admin/vehicles/${v.id}`} className="flex items-center gap-4 py-3 hover:bg-cream/5">
                <span className="cut cut-sm relative block h-14 w-20 shrink-0 overflow-hidden bg-navy-800"><SafeImage src={v.images[0]?.src ?? ""} alt="" fill sizes="80px" className="object-cover" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{v.year} {v.brand} {v.model}</span>
                  <span className="text-sm text-cream/60">{categoryLabels[v.category]}, {formatMoney(v.dailyRate)}/day</span>
                </span>
                <span className="text-sm">{v.archivedAt ? <span className="chip bg-cream/10">Archived</span> : v.isAvailable ? <span className="chip bg-ok/15 text-ok">Taking bookings</span> : <span className="chip bg-bad/15 text-bad">Paused</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
