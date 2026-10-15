"use client";
import Link from "next/link";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page grid min-h-[80vh] place-content-center py-24 text-center">
      <h1 className="h2">This page didn&apos;t load</h1>
      <p className="mx-auto mt-4 max-w-md text-cream/70">Something went wrong on our side. Try again, or contact us if it keeps happening.</p>
      <div className="mt-8 flex justify-center gap-3"><button onClick={reset} className="btn-primary">Try again</button><Link href="/contact" className="btn-ghost">Contact us</Link></div>
    </main>
  );
}
