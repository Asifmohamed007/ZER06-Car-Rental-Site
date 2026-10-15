"use client";
/** Submits the surrounding GET form when a select or checkbox changes. The form still works without JS. */
export function AutoSubmitForm({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <form method="get" action="/fleet" className={className} aria-label={label}
      onChange={(e) => {
        const t = e.target as HTMLElement;
        if (t instanceof HTMLSelectElement || (t instanceof HTMLInputElement && t.type === "checkbox")) e.currentTarget.requestSubmit();
      }}>
      {children}
    </form>
  );
}
