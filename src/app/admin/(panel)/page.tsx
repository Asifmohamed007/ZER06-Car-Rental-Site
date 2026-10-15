import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { dashboardStats, listBookings } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusChip } from "@/components/admin/StatusChip";

export default async function Dashboard() {
  await requireAdmin();
  const [stats, pending, s] = await Promise.all([dashboardStats(), listBookings({ status: "pending", limit: 8 }), getSettings()]);
  const cards = [
    ["Awaiting confirmation", stats.pending, "/admin/bookings?status=pending"],
    ["Upcoming confirmed", stats.upcoming, "/admin/bookings?status=confirmed"],
    ["Unanswered enquiries", stats.enquiries, "/admin/enquiries"],
    ["Cars listed", stats.vehicles, "/admin/vehicles"],
  ] as const;
  return (
    <>
      <h1 className="h2">Overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, n, href]) => (
          <Link key={label} href={href} className="panel cut cut-sm p-5 hover:bg-navy-700/60">
            <p className="font-display text-5xl font-bold">{n}</p><p className="mt-1 text-cream/65">{label}</p>
          </Link>
        ))}
      </div>
      <h2 className="h3 mt-12">Requests to review</h2>
      {pending.length === 0 ? <p className="mt-4 text-cream/60">No pending requests.</p> : (
        <ul className="mt-4 divide-y divide-cream/10 border-y border-cream/10">
          {pending.map((b) => (
            <li key={b.id}><Link href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-cream/5">
              <span><span className="font-medium">{b.reference}</span> · {b.vehicleName}<br /><span className="text-sm text-cream/60">{b.customerName}, {formatDateTime(b.pickupAt, s.regional.timezone)}</span></span>
              <span className="flex items-center gap-3">{formatMoney(b.total)}<StatusChip status={b.status} /></span>
            </Link></li>
          ))}
        </ul>
      )}
    </>
  );
}
