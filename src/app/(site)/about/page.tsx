import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/settings";
import { Parallax } from "@/components/Parallax";
import { SafeImage } from "@/components/SafeImage";
import { Reveal } from "@/components/Reveal";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "About us", description: `${s.about.intro} Car rental in Qatar since ${s.business.established}.`, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <section className="relative isolate overflow-hidden pb-20 pt-[calc(var(--header-h)+4rem)]">
        <Parallax className="absolute inset-0 -z-10 opacity-40">
          <SafeImage src={s.homepage.eventsImage} alt="" fill priority sizes="100vw" className="object-cover" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 to-ink" />
        <div className="page">
          <h1 className="h1 max-w-[12ch]">Driven by the road ahead</h1>
          <p className="lede mt-6">{s.about.intro}</p>
        </div>
      </section>
      <section className="page grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-display text-[clamp(4rem,12vw,9rem)] font-bold leading-none text-brand-bright">{s.business.established}</p>
          <p className="mt-2 text-cream/60">The year {s.business.name} started.</p>
        </div>
        <div className="prose-z text-lg">{s.about.story.split(/\n{2,}/).map((p) => <p key={p.slice(0, 30)}>{p}</p>)}</div>
      </section>
      {s.about.services.length > 0 && (
        <section className="page py-16" aria-labelledby="svc-h">
          <h2 id="svc-h" className="h2">What we do</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {s.about.services.map((x, i) => (
              <Reveal key={x.title} delay={i * 80} className="border-t border-chrome/40 pt-6">
                <h3 className="h3">{x.title}</h3>
                <p className="mt-3 text-cream/70">{x.text}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap gap-3">
            <Link href="/fleet" className="btn-primary">Explore our fleet</Link>
            <Link href="/contact" className="btn-ghost">Contact us</Link>
          </div>
        </section>
      )}
    </>
  );
}
