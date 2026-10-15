import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { listBookings } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { formatDateTime, formatMoney, statusLabels } from "@/lib/format";
import { StatusChip } from "@/components/admin/StatusChip";

export default async function BookingsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  await requireAdmin();
  const status = Object.keys(statusLabels).includes(searchParams.status ?? "") ? searchParams.status : undefined;
  const [rows, s] = await Promise.all([listBookings({ status, q: searchParams.q }), getSettings()]);
  const tz = s.regional.timezone;
  return (
    <>
      <h1 className="h2">Bookings</h1>
      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div><label className="label" htmlFor="bq">Search</label><input id="bq" name="q" defaultValue={searchParams.q} className="input" placeholder="Reference, name, phone, car" /></div>
        <div><label className="label" htmlFor="bs">Status</label>
          <select id="bs" name="status" defaultValue={status ?? ""} className="input"><option value="">All</option>{Object.entries(statusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <button className="btn-ghost btn-sm">Filter</button>
      </form>
      {rows.length === 0 ? <p className="mt-8 text-cream/60">No bookings match.</p> : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-cream/55"><tr className="border-b border-cream/10">{["Reference", "Car", "Customer", "Pickup", "Return", "Total", "Status"].map((h) => <th key={h} className="py-3 pr-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-cream/10 hover:bg-cream/5">
                  <td className="py-3 pr-4"><Link href={`/admin/bookings/${b.id}`} className="font-medium underline-offset-4 hover:underline">{b.reference}</Link></td>
                  <td className="py-3 pr-4">{b.vehicleName}</td>
                  <td className="py-3 pr-4">{b.customerName}<br /><span className="text-cream/55">{b.customerPhone}</span></td>
                  <td className="py-3 pr-4">{formatDateTime(b.pickupAt, tz)}</td>
                  <td className="py-3 pr-4">{formatDateTime(b.returnAt, tz)}</td>
                  <td className="py-3 pr-4">{formatMoney(b.total)}</td>
                  <td className="py-3 pr-4"><StatusChip status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
