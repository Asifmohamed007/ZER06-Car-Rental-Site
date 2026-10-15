import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page grid min-h-[80vh] place-content-center py-24 text-center">
      <p className="font-display text-[clamp(6rem,20vw,12rem)] font-bold leading-none text-brand-bright">404</p>
      <h1 className="h2 mt-2">Wrong turn</h1>
      <p className="mx-auto mt-4 max-w-md text-cream/70">This page doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/" className="btn-primary">Go home</Link><Link href="/fleet" className="btn-ghost">Browse the fleet</Link></div>
    </main>
  );
}
