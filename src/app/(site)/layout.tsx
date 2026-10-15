import { getSettings } from "@/server/settings";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/Logo";
import { WhatsAppFloat } from "@/components/WhatsAppButton";
import { CursorGlow } from "@/components/CursorGlow";
import { buildWhatsAppMessage } from "@/lib/whatsapp";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <CursorGlow />
      <SiteHeader logo={<Logo name={s.business.name} />} bookHref="/fleet" />
      <main id="main" className="relative z-10">{children}</main>
      <SiteFooter s={s} />
      <WhatsAppFloat number={s.business.whatsapp} message={buildWhatsAppMessage({ businessName: s.business.name })} fallbackHref="/contact" />
    </>
  );
}
