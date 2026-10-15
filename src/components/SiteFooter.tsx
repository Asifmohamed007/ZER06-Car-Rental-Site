import Link from "next/link";
import type { SiteSettings } from "@/lib/settings-schema";
import { whatsappLink } from "@/lib/whatsapp";
import { Logo } from "./Logo";

export function SiteFooter({ s }: { s: SiteSettings }) {
  const wa = whatsappLink(s.business.whatsapp);
  return (
    <footer className="relative z-10 mt-24 border-t border-cream/10 bg-ink/80">
      <div className="page grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo name={s.business.name} />
          <p className="mt-5 max-w-xs text-cream/65">{s.business.tagline}</p>
          {s.business.instagram && (
            <a href={s.business.instagram} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-cream/80 hover:text-cream">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              Follow us on Instagram
            </a>
          )}
        </div>
        <FooterCol title="Explore" links={[["/fleet", "Our fleet"], ["/about", "About us"], ["/contact", "Contact"], ["/#faq", "FAQ"]]} />
        <FooterCol title="Rent with us" links={[["/fleet?category=economy", "Economy cars"], ["/fleet?category=suv", "SUV rental"], ["/fleet?category=luxury", "Luxury cars"], ["/policies", "Rental policies"]]} />
        <div>
          <h2 className="font-display text-lg font-semibold">Get in touch</h2>
          <ul className="mt-4 space-y-2.5 text-cream/70">
            <li><a className="hover:text-cream" href={`tel:${s.business.phone.replace(/\s/g, "")}`}>{s.business.phone}</a></li>
            <li><a className="hover:text-cream" href={`mailto:${s.business.email}`}>{s.business.email}</a></li>
            {wa && <li><a className="hover:text-cream" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
            <li>{s.business.address}</li>
            {s.business.hours.map((h) => <li key={h.label} className="text-sm">{h.label}: {h.value}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="page flex flex-col gap-2 py-6 text-sm text-cream/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {s.business.name}. Est. {s.business.established}.</p>
          <p><Link href="/policies" className="hover:text-cream">Rental policies</Link></p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => <li key={href}><Link href={href} className="text-cream/70 hover:text-cream">{label}</Link></li>)}
      </ul>
    </div>
  );
}
