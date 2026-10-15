"use client";
import { useState } from "react";
import { SafeImage } from "./SafeImage";

export function Gallery({ images, name }: { images: { id: number; src: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="cut cut-lg relative aspect-[16/10] overflow-hidden bg-navy-800">
        <SafeImage key={current?.src} src={current?.src ?? ""} alt={current?.alt ?? name} fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6" aria-label="More photos">
          {images.map((img, i) => (
            <li key={img.id}>
              <button type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1} of ${images.length}`} aria-pressed={i === active}
                className={`cut cut-sm relative block aspect-[4/3] w-full overflow-hidden bg-navy-800 transition-opacity ${i === active ? "opacity-100 ring-2 ring-cream" : "opacity-60 hover:opacity-100"}`}>
                <SafeImage src={img.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
