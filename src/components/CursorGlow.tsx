"use client";
import { useEffect, useRef } from "react";

/** A soft blue light that trails the pointer on desktop. Disabled on touch devices and for reduced motion. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 3, cx = x, cy = y, frame = 0;
    const loop = () => {
      cx += (x - cx) * 0.14; cy += (y - cy) * 0.14;
      el.style.transform = `translate3d(${cx - 300}px, ${cy - 300}px, 0)`;
      frame = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0; // stops when settled
    };
    const onMove = (e: PointerEvent) => { x = e.clientX; y = e.clientY; el.style.opacity = "1"; if (!frame) frame = requestAnimationFrame(loop); };
    const onLeave = () => { el.style.opacity = "0"; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { window.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(frame); };
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-0 h-[600px] w-[600px] rounded-full opacity-0 transition-opacity duration-500"
      style={{ background: "radial-gradient(closest-side, rgba(58,63,217,0.16), transparent)" }} />
  );
}
