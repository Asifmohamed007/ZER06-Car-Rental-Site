export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-cream/10 border-y border-cream/10">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="relative h-4 w-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-4 bg-cream" />
              <span className="absolute left-1/2 top-0 h-4 w-px bg-cream transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="prose-z pb-6 text-cream/75">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
