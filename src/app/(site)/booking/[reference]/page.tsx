import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/settings";
import { getBookingForCustomer } from "@/server/bookings";
import { formatDateTime, formatMoney, statusLabels } from "@/lib/format";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { StatusNote } from "@/components/StatusNote";
import { WaIcon } from "@/components/WhatsAppButton";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

export default async function BookingPage({ params, searchParams }: { params: { reference: string }; searchParams: { t?: string } }) {
  const s = await getSettings();
  const ref = decodeURIComponent(params.reference).slice(0, 20);
  const b = await getBookingForCustomer(ref, searchParams.t ?? "");
  const tz = s.regional.timezone;

  if (!b) {
    return (
      <div className="page max-w-2xl pb-10 pt-[calc(var(--header-h)+3rem)]">
        <h1 className="h2">We can&apos;t show this booking</h1>
        <p className="lede mt-4">The link may be incomplete. Use the full link from the page you saw after booking, or contact us with your booking reference.</p>
        <Link href="/contact" className="btn-primary mt-8">Contact us</Link>
      </div>
    );
  }

  const wa = whatsappLink(s.business.whatsapp, buildWhatsAppMessage({
    businessName: s.business.name, reference: b.reference, vehicleName: b.vehicleName,
    pickup: formatDateTime(b.pickupAt, tz), return: formatDateTime(b.returnAt, tz), location: b.pickupLocation,
    estimate: formatMoney(b.total, s.regional.currency),
  }));
  const tone = b.status === "confirmed" || b.status === "completed" ? "success" : b.status === "cancelled" ? "error" : "warn";
  const headline = { pending: "Request received", confirmed: "Booking confirmed", cancelled: "Booking cancelled", completed: "Rental completed" }[b.status] ?? "Your booking";

  return (
    <div className="page max-w-3xl pb-10 pt-[calc(var(--header-h)+3rem)]">
      <p className="text-cream/60">Booking reference</p>
      <p className="font-display text-4xl font-bold tracking-wider">{b.reference}</p>
      <h1 className="h1 mt-6">{headline}</h1>

      <div className="mt-8">
        <StatusNote tone={tone} title={`Status: ${statusLabels[b.status]}`}>
          {b.status === "pending" && <p>Your car is held while we review your request. <strong>This is not a confirmed booking yet.</strong> We&apos;ll contact you on {b.customerPhone.replace(/.(?=.{3})/g, "•")} or by email to confirm and arrange payment.</p>}
          {b.status === "confirmed" && <p>Your car is reserved. Bring your driving licence and ID to pickup.</p>}
          {b.status === "cancelled" && <p>This booking was cancelled. Contact us if you think this is a mistake.</p>}
        </StatusNote>
      </div>
      <p className="mt-4 text-sm text-cream/60">Save this page&apos;s link to check your booking status later. Keep it private: anyone with the link can see these details.</p>

      <section className="panel cut mt-10 p-6 sm:p-8" aria-labelledby="sum-h">
        <h2 id="sum-h" className="h3">Summary</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><dt className="text-sm text-cream/55">Car</dt><dd className="mt-1 text-lg"><Link href={`/fleet/${b.vehicleSlug}`} className="underline-offset-4 hover:underline">{b.vehicleName}</Link></dd></div>
          <div><dt className="text-sm text-cream/55">Name</dt><dd className="mt-1 text-lg">{b.customerName}</dd></div>
          <div><dt className="text-sm text-cream/55">Pickup</dt><dd className="mt-1">{formatDateTime(b.pickupAt, tz)}<br /><span className="text-cream/70">{b.pickupLocation}</span></dd></div>
          <div><dt className="text-sm text-cream/55">Return</dt><dd className="mt-1">{formatDateTime(b.returnAt, tz)}<br /><span className="text-cream/70">{b.returnLocation}</span></dd></div>
        </dl>
        <dl className="mt-8 space-y-2 border-t border-cream/10 pt-5">
          {b.breakdown.lines.map((l) => <div key={l.label} className="flex justify-between gap-4 text-cream/80"><dt>{l.label}</dt><dd>{formatMoney(l.amount, s.regional.currency)}</dd></div>)}
          {b.breakdown.tax > 0 && <div className="flex justify-between gap-4 text-cream/80"><dt>Tax</dt><dd>{formatMoney(b.breakdown.tax, s.regional.currency)}</dd></div>}
          <div className="flex justify-between gap-4 border-t border-cream/15 pt-3 font-display text-2xl font-bold"><dt>Total</dt><dd>{formatMoney(b.total, s.regional.currency)}</dd></div>
          {b.deposit > 0 && <div className="flex justify-between gap-4 text-sm text-cream/60"><dt>Refundable security deposit</dt><dd>{formatMoney(b.deposit, s.regional.currency)}</dd></div>}
          <div className="flex justify-between gap-4 text-sm text-cream/60"><dt>Payment</dt><dd>{b.paymentMethod === "pay_on_arrival" ? "Pay on arrival" : "Arranged with our team"}</dd></div>
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="next-h">
        <h2 id="next-h" className="h3">What happens next</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-cream/80">
          {b.status === "pending" && <li>We review your request and contact you to confirm.</li>}
          <li>Bring your driving licence and identification to pickup.</li>
          <li>Questions? Message us with your reference {b.reference}.</li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon />Message us about this booking</a>}
          <a href={`tel:${s.business.phone.replace(/\s/g, "")}`} className="btn-ghost">Call {s.business.phone}</a>
        </div>
      </section>
    </div>
  );
}
