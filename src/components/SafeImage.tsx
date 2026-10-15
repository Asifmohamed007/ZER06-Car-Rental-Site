"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image with a branded fallback when a placeholder or uploaded photo fails to load. */
export function SafeImage({ alt, className, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) {
    return (
      <div role="img" aria-label={alt} className={`grid place-items-center bg-gradient-to-br from-navy-700 to-ink ${props.fill ? "absolute inset-0" : ""} ${className ?? ""}`}>
        <svg viewBox="0 0 120 48" className="w-2/5 max-w-[180px] text-chrome/40" fill="currentColor" aria-hidden>
          <path d="M8 34c0-3 2-5 6-6l14-3 14-10c3-2 6-3 10-3h20c5 0 9 2 13 5l9 8 12 2c4 1 6 3 6 6v4c0 2-1 3-3 3h-7a9 9 0 0 0-18 0H43a9 9 0 0 0-18 0h-14c-2 0-3-1-3-3z" />
          <circle cx="34" cy="40" r="6" /><circle cx="94" cy="40" r="6" />
        </svg>
      </div>
    );
  }
  return <Image alt={alt} className={className} {...props} onError={() => setFailed(true)} />;
}
