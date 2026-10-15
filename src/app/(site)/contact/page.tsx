import type { Metadata } from "next";
import { getSettings } from "@/server/settings";
import { ContactForm } from "@/components/ContactForm";
import { WaIcon } from "@/components/WhatsAppButton";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, email or WhatsApp us to rent a car in Qatar, or send a message through our contact form.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: { subject?: string } }) {
  const s = await getSettings();
  const b = s.business;
  const wa = whatsappLink(b.whatsapp, buildWhatsAppMessage({ businessName: b.name }));
  return (
    <div className="page pb-10 pt-[calc(var(--header-h)+3rem)]">
      <h1 className="h1">Contact us</h1>
      <p className="lede mt-5">Ask about a car, a date or a special occasion. We&apos;re happy to help.</p>
      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-wa w-full sm:w-auto"><WaIcon />Chat on WhatsApp</a>}
          <dl className="space-y-6">
            <div><dt className="text-sm text-cream/55">Phone</dt><dd className="mt-1 text-xl"><a href={`tel:${b.phone.replace(/\s/g, "")}`} className="hover:text-white">{b.phone}</a></dd></div>
            <div><dt className="text-sm text-cream/55">Email</dt><dd className="mt-1 text-xl"><a href={`mailto:${b.email}`} className="break-all hover:text-white">{b.email}</a></dd></div>
            <div><dt className="text-sm text-cream/55">Location</dt><dd className="mt-1 text-xl">{b.mapsUrl ? <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{b.address}</a> : b.address}</dd></div>
            {b.instagram && <div><dt className="text-sm text-cream/55">Instagram</dt><dd className="mt-1 text-xl"><a href={b.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">@{b.instagram.replace(/\/+$/, "").split("/").pop()}</a></dd></div>}
            <div>
              <dt className="text-sm text-cream/55">Opening hours</dt>
              <dd className="mt-1"><ul className="space-y-1">{b.hours.map((h) => <li key={h.label} className="flex justify-between gap-6 max-w-xs"><span>{h.label}</span><span className="text-cream/75">{h.value}</span></li>)}</ul></dd>
            </div>
          </dl>
        </div>
        <div className="glass cut p-6 sm:p-8">
          <h2 className="h3 mb-6">Send us a message</h2>
          <ContactForm defaultSubject={(searchParams.subject ?? "").slice(0, 150)} />
        </div>
      </div>
    </div>
  );
}
