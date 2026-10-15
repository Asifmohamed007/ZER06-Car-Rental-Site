import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP for rate limiting. Hosting platforms (Vercel, Netlify) set these headers. */
export function clientIp(): string {
  const h = headers();
  const real = h.get("x-real-ip") || h.get("x-nf-client-connection-ip");
  if (real) return real.trim();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    const trust = Math.max(1, Number(process.env.TRUST_PROXY ?? 1));
    return parts[Math.max(0, parts.length - trust)] ?? "unknown";
  }
  return "unknown";
}
