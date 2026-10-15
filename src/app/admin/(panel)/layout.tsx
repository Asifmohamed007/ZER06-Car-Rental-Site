import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/server/auth";
import { logoutAction } from "../actions";

const NAV = [["/admin", "Overview"], ["/admin/bookings", "Bookings"], ["/admin/vehicles", "Vehicles"], ["/admin/enquiries", "Enquiries"], ["/admin/settings", "Settings"]] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-cream/10 bg-navy-900 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 p-5">
          <Image src="/brand/logo-192.png" alt="" width={36} height={36} className="rounded-full" />
          <span className="font-display text-lg font-bold uppercase">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {NAV.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-sm px-3 py-2 text-cream/80 hover:bg-cream/10 hover:text-cream">{label}</Link>)}
          <Link href="/" className="whitespace-nowrap rounded-sm px-3 py-2 text-cream/50 hover:text-cream" target="_blank">View website</Link>
        </nav>
        <div className="hidden p-5 text-sm text-cream/50 lg:block">
          <p className="truncate">{admin.email}</p>
          <p className="capitalize">{admin.role}</p>
          <form action={logoutAction} className="mt-3"><button className="underline hover:text-cream">Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">
        {children}
        <form action={logoutAction} className="mt-12 lg:hidden"><button className="text-sm text-cream/60 underline">Sign out ({admin.email})</button></form>
      </main>
    </div>
  );
}
