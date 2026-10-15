import type { Metadata, Viewport } from "next";
import "@fontsource/saira/400.css";
import "@fontsource/saira/500.css";
import "@fontsource/saira/600.css";
import "@fontsource/saira-condensed/600.css";
import "@fontsource/saira-condensed/700.css";
import "./globals.css";
import { getSettings } from "@/server/settings";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.seo.defaultTitle, template: `%s | ${s.business.name}` },
    description: s.seo.defaultDescription,
    applicationName: s.business.name,
    openGraph: { type: "website", siteName: s.business.name, locale: "en_QA", images: [{ url: s.seo.ogImage }] },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#070A29", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
