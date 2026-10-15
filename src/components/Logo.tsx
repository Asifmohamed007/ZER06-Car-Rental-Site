import Image from "next/image";
import Link from "next/link";

export function Logo({ name, size = 44, withText = true }: { name: string; size?: number; withText?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label={`${name} home`}>
      <Image src="/brand/logo-192.png" alt="" width={size} height={size} priority className="rounded-full ring-1 ring-cream/20 transition-transform duration-300 group-hover:rotate-[-6deg]" />
      {withText && (
        <span className="font-display text-xl font-bold uppercase leading-none tracking-wide">
          {name.split(" ")[0]}
          <span className="block text-[0.68rem] font-medium tracking-[0.22em] text-cream/60">{name.split(" ").slice(1).join(" ") || "Rental Cars"}</span>
        </span>
      )}
    </Link>
  );
}
