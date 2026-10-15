import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getBookingById, ALLOWED_TRANSITIONS } from "@/server/bookings";
import { getSettings } from "@/server/settings";
import { formatDateTime, formatMoney } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { StatusChip } from "@/components/admin/StatusChip";
import { StatusButtons, DetailsForm } from "./BookingActions";

export default async function BookingDetail({ params }: { params: { id: string } }) {
  await requireAdmin();
  const id = Number(params.id);
  if (!Number.isSafeInteger(id)) notFound();
  const [b, s] = await Promise.all([getBookingById(id), getSettings()]);
  if (!b) notFound();
  const tz = s.regional.timezone;
  const wa = whatsappLink(b.customerPhone, `Hello ${b.customerName}, this is ${s.business.name} about your booking ${b.reference} (${b.vehicleName}).`);
  return (
    <>
      <Link href="/admin/bookings" className="text-sm text-cream/60 hover:text-cream">← All bookings</Link>
      <div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="h2">{b.reference}</h1><StatusChip status={b.status} /></div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_1fr]">
        <section className="panel cut p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div><dt className="text-sm text-cream/55">Car</dt><dd><Link className="underline-offset-4 hover:underline" href={`/fleet/${b.vehicleSlug}`} target="_blank">{b.vehicleName}</Link></dd></div>
            <div><dt className="text-sm text-cream/55">Requested</dt><dd>{formatDateTime(b.createdAt, tz)}</dd></div>
            <div><dt className="text-sm text-cream/55">Pickup</dt><dd>{formatDateTime(b.pickupAt, tz)}<br /><span className="text-cream/65">{b.pickupLocation}</span></dd></div>
            <div><dt className="text-sm text-cream/55">Return</dt><dd>{formatDateTime(b.returnAt, tz)}<br /><span className="text-cream/65">{b.returnLocation}</span></dd></div>
            <div><dt className="text-sm text-cream/55">Customer</dt><dd>{b.customerName}{b.driverAge ? `, age ${b.driverAge}` : ""}</dd></div>
            <div><dt className="text-sm text-cream/55">Contact</dt><dd><a href={`tel:${b.customerPhone}`} className="underline">{b.customerPhone}</a><br /><a href={`mailto:${b.customerEmail}`} className="break-all underline">{b.customerEmail}</a></dd></div>
            <div><dt className="text-sm text-cream/55">Additional driver</dt><dd>{b.additionalDriver ? "Yes" : "No"}</dd></div>
            <div><dt className="text-sm text-cream/55">Payment method</dt><dd>{b.paymentMethod === "pay_on_arrival" ? "Pay on arrival" : "Arrange with team"}</dd></div>
            {b.notes && <div className="sm:col-span-2"><dt className="text-sm text-cream/55">Customer notes</dt><dd className="whitespace-pre-line">{b.notes}</dd></div>}
          </dl>
          <dl className="mt-6 space-y-1.5 border-t border-cream/10 pt-4">
            {b.breakdown.lines.map((l) => <div key={l.label} className="flex justify-between"><dt>{l.label}</dt><dd>{formatMoney(l.amount)}</dd></div>)}
            {b.breakdown.tax > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(b.breakdown.tax)}</dd></div>}
            <div className="flex justify-between font-display text-xl font-bold"><dt>Total</dt><dd>{formatMoney(b.total)}</dd></div>
            {b.deposit > 0 && <div className="flex justify-between text-cream/60"><dt>Deposit</dt><dd>{formatMoney(b.deposit)}</dd></div>}
          </dl>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa btn-sm mt-6">Message customer on WhatsApp</a>}
        </section>
        <div className="space-y-8">
          <section><h2 className="h3 mb-4">Status</h2><StatusButtons id={b.id} next={ALLOWED_TRANSITIONS[b.status] ?? []} /></section>
          <section><h2 className="h3 mb-4">Payment and notes</h2><DetailsForm id={b.id} paymentStatus={b.paymentStatus} adminNotes={b.adminNotes} /></section>
        </div>
      </div>
    </>
  );
}
