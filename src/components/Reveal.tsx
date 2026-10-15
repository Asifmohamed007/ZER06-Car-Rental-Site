"use client";
import { useEffect, useRef } from "react";

/** Fades content in once when scrolled into view. Content stays visible without JS or with reduced motion. */
export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "li"; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already on screen: don't hide it
    el.classList.add("reveal-armed");
    el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <Tag ref={ref as any} className={className}>{children}</Tag>;
}
