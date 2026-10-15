import Link from "next/link";
import { getSettings } from "@/server/settings";
import { listVehicles, listCategoriesInStock } from "@/server/vehicles";
import { safeRead } from "@/server/safe";
import { Parallax } from "@/components/Parallax";
import { SafeImage } from "@/components/SafeImage";
import { QuickSearch } from "@/components/QuickSearch";
import { VehicleCard } from "@/components/VehicleCard";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { StatusNote } from "@/components/StatusNote";
import { WaIcon } from "@/components/WhatsAppButton";
import { categoryLabels, formatMoney } from "@/lib/format";
import { defaultWindow } from "@/lib/time";
import { buildWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site-url";

export default async function HomePage() {
  const s = await getSettings();
  const [{ data: vehicles, failed }, { data: cats }] = await Promise.all([
    safeRead("home.vehicles", () => listVehicles({ sort: "featured" }), []),
    safeRead("home.categories", () => listCategoriesInStock(), []),
  ]);
  const featured = (vehicles.filter((v) => v.isFeatured).length ? vehicles.filter((v) => v.isFeatured) : vehicles).slice(0, 3);
  const headline = s.homepage.heroHeadline.split(/(?<=\.)\s+/);
  const wa = whatsappLink(s.business.whatsapp, buildWhatsAppMessage({ businessName: s.business.name }));
  const eventsWa = whatsappLink(s.business.whatsapp, `Hello ${s.business.name}, I'd like to ask about a car for a wedding or event.\nDate:\nPickup and drop-off locations:\nCar you have in mind:`);

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: s.homepage.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const orgJsonLd = {
    "@context": "https://schema.org", "@type": "Organization", name: s.business.name, url: siteUrl(),
    logo: `${siteUrl()}/brand/logo-512.png`, sameAs: s.business.instagram ? [s.business.instagram] : [],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, faqJsonLd]).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-[var(--header-h)]">
        <Parallax className="absolute inset-0 -z-10">
          <SafeImage src={s.homepage.heroImage} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,4,13,0.92)_0%,rgba(7,10,41,0.7)_45%,rgba(7,10,41,0.15)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="page pb-10 pt-24 sm:pb-14">
          <h1 className="h1 max-w-[14ch]">
            {headline.map((line, i) => (
              <span key={i} className="hero-line block" style={{ animationDelay: `${120 + i * 160}ms` }}>{line}</span>
            ))}
          </h1>
          <div aria-hidden className="hero-rule mt-7 h-px w-full max-w-md bg-gradient-to-r from-cream via-chrome to-transparent" />
          <p className="hero-line lede mt-6" style={{ animationDelay: "480ms" }}>{s.homepage.heroSubtext}</p>
          <div className="hero-line mt-8 flex flex-wrap gap-3" style={{ animationDelay: "600ms" }}>
            <Link href="/fleet" className="btn-cream">Explore our fleet</Link>
            <Link href="#find" className="btn-ghost">Book your ride</Link>
          </div>
          <div id="find" className="mt-12 scroll-mt-28">
            <QuickSearch defaults={defaultWindow(s.regional.timezone)} categories={cats.map((c) => ({ value: c.category, label: categoryLabels[c.category] }))} />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="page py-24" aria-labelledby="featured-h">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 id="featured-h" className="h2">Ready when you are</h2>
            <p className="lede mt-4">A few of the cars customers ask for most. Every price is per day, in {s.regional.currency}.</p>
          </div>
          <Link href="/fleet" className="btn-ghost shrink-0">See the full fleet</Link>
        </Reveal>
        {failed ? (
          <div className="mt-10"><StatusNote tone="error" title="We couldn't load the fleet right now.">Refresh the page in a moment, or <Link className="underline" href="/contact">contact us</Link> to check availability.</StatusNote></div>
        ) : featured.length === 0 ? (
          <div className="mt-10"><StatusNote title="New cars are being added.">Check back soon or message us for current availability.</StatusNote></div>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <VehicleCard key={v.id} v={v} whatsapp={s.business.whatsapp} businessName={s.business.name} availability={v.isAvailable ? "available" : "unavailable"} />
            ))}
          </div>
        )}
      </section>

      {/* Categories: only types that are actually in the fleet */}
      {cats.length > 0 && (
        <section className="relative border-y border-cream/10 bg-navy-900/60 py-20" aria-labelledby="cat-h">
          <div aria-hidden className="speed-lines absolute inset-0 opacity-60" />
          <div className="page relative">
            <h2 id="cat-h" className="h2">Choose your drive</h2>
            <ul className="mt-10 divide-y divide-cream/10 border-y border-cream/10">
              {cats.map((c) => (
                <li key={c.category}>
                  <Link href={`/fleet?category=${c.category}`} className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-white">
                    <span className="display text-[clamp(2.25rem,6vw,4.5rem)] transition-transform duration-300 group-hover:translate-x-3">{categoryLabels[c.category]}</span>
                    <span className="shrink-0 text-right text-cream/65">
                      <span className="block">{c.count} {c.count === 1 ? "car" : "cars"}</span>
                      <span className="text-sm">from {formatMoney(c.fromRate)} a day</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Weddings & events, from the brand's Instagram focus */}
      {s.homepage.eventsTitle && (
        <section className="page grid items-center gap-12 py-24 lg:grid-cols-2" aria-labelledby="events-h">
          <Reveal className="cut cut-lg relative aspect-[5/4] overflow-hidden bg-navy-800">
            <SafeImage src={s.homepage.eventsImage} alt="A polished car ready for a wedding arrival" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
          <Reveal delay={100}>
            <h2 id="events-h" className="h2 max-w-[16ch]">{s.homepage.eventsTitle}</h2>
            <p className="lede mt-6">{s.homepage.eventsText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {eventsWa && <a href={eventsWa} target="_blank" rel="noopener noreferrer" className="btn-wa"><WaIcon />Ask on WhatsApp</a>}
              <Link href="/contact?subject=Wedding%20or%20event" className="btn-ghost">Send an enquiry</Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* Benefits */}
      <section className="page py-12" aria-labelledby="why-h">
        <h2 id="why-h" className="sr-only">Why rent with us</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Prices you can see", "The daily rate, any location fees and the total are shown before you send a request. No surprises at the counter."],
            ["Book your way", "Send a booking request online in a couple of minutes, or message us on WhatsApp if you'd rather talk it through."],
            ["People who answer", `Questions about a car or your booking go to our team directly, by phone, email or WhatsApp.`],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-chrome/40 pt-6">
              <h3 className="h3">{t}</h3>
              <p className="mt-3 text-cream/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: a real sequence, so numbered */}
      <section className="page py-24" aria-labelledby="how-h">
        <h2 id="how-h" className="h2">How booking works</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ["Pick a car and dates", "Choose your car, pickup and return times, and where you'd like to collect it."],
            ["Send your request", "Check the price breakdown and send your details. You get a booking reference straight away."],
            [s.booking.requireApproval ? "We confirm" : "Drive away", s.booking.requireApproval ? "Our team checks your request and confirms by phone, email or WhatsApp, including payment arrangements." : "Your booking is confirmed. Bring your licence and ID to pickup."],
          ].map(([t, d], i) => (
            <li key={t} className="panel cut p-7">
              <span className="font-display text-6xl font-bold text-brand-bright" aria-hidden>{i + 1}</span>
              <h3 className="h3 mt-3">{t}</h3>
              <p className="mt-2 text-cream/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Reviews: only shown when real reviews are entered in the admin */}
      {s.homepage.reviews.length > 0 && (
        <section className="page py-12" aria-labelledby="rev-h">
          <h2 id="rev-h" className="h2">What customers say</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {s.homepage.reviews.map((r) => (
              <figure key={r.name + r.text.slice(0, 10)} className="panel cut p-7">
                <blockquote className="text-lg leading-relaxed">&ldquo;{r.text}&rdquo;</blockquote>
                <figcaption className="mt-5 text-cream/60">{r.name}{r.source ? `, ${r.source}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {s.homepage.faqs.length > 0 && (
        <section id="faq" className="page grid scroll-mt-24 gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="faq-h">
          <div>
            <h2 id="faq-h" className="h2">Questions, answered</h2>
            <p className="mt-4 text-cream/70">Something else? <Link href="/contact" className="underline underline-offset-4 hover:text-white">Ask us directly.</Link></p>
          </div>
          <Faq items={s.homepage.faqs} />
        </section>
      )}

      {/* Contact CTA */}
      <section className="page" aria-labelledby="cta-h">
        <div className="cut cut-lg relative overflow-hidden bg-brand px-7 py-14 sm:px-14">
          <div aria-hidden className="speed-lines absolute inset-0" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 id="cta-h" className="h2 max-w-[18ch]">Stop dreaming. Start driving.</h2>
              <p className="mt-4 max-w-[52ch] text-cream/85">Tell us where you&apos;re going and when. We&apos;ll help you find the right car.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-cream"><WaIcon />WhatsApp us</a>}
              <Link href="/contact" className="btn bg-navy text-cream hover:bg-navy-700">Contact us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
