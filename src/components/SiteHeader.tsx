"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/fleet", label: "Fleet" },
  { href: "/about", label: "About" },
  { href: "/policies", label: "Rental policies" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ logo, bookHref }: { logo: React.ReactNode; bookHref: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setScrolled(window.scrollY > 24); ticking = false; });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const solid = scrolled || open || path !== "/";
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-300 ${solid ? "bg-navy-900/85 shadow-[0_1px_0_rgba(254,237,219,0.08)] backdrop-blur-md" : "bg-transparent"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cream focus:px-4 focus:py-2 focus:text-navy">Skip to content</a>
      <div className="page flex h-[var(--header-h)] items-center justify-between gap-6">
        {logo}
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                className={`relative py-2 text-[0.95rem] transition-colors hover:text-cream ${active ? "text-cream" : "text-cream/70"} after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-cream after:transition-transform after:duration-300 hover:after:scale-x-100 ${active ? "after:scale-x-100" : ""}`}>
                {n.label}
              </Link>
            );
          })}
          <Link href={bookHref} className="btn-primary btn-sm">Book your ride</Link>
        </nav>
        <button type="button" className="md:hidden -mr-2 grid h-11 w-11 place-items-center" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-3.5 w-6">
            <span className={`absolute left-0 top-0 h-0.5 w-6 bg-cream transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`absolute left-0 bottom-0 h-0.5 w-6 bg-cream transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <div id="mobile-nav" hidden={!open} className="md:hidden h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-cream/10 bg-navy-900">
        <nav aria-label="Mobile" className="page flex flex-col py-6">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="display border-b border-cream/10 py-4 text-4xl">{n.label}</Link>
          ))}
          <Link href={bookHref} className="btn-primary mt-8">Book your ride</Link>
        </nav>
      </div>
    </header>
  );
}
