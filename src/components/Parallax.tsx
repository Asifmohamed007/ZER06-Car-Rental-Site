"use client";
import { useEffect, useRef } from "react";

/** Moves its child slightly slower than the page. Transform-only, rAF-throttled, paused off-screen, off for reduced motion. */
export function Parallax({ children, strength = 0.18, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = true, frame = 0;
    const update = () => {
      frame = 0;
      const r = o.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -strength;
      i.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.12)`;
    };
    const onScroll = () => { if (visible && !frame) frame = requestAnimationFrame(update); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); });
    io.observe(o);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [strength]);
  return (
    <div ref={outer} className={`overflow-hidden ${className}`}>
      <div ref={inner} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.12)" }}>{children}</div>
    </div>
  );
}
