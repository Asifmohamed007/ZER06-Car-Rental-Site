import type { MetadataRoute } from "next";
import { listVehicles, listCategoriesInStock } from "@/server/vehicles";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = ["", "/fleet", "/about", "/contact", "/policies"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
  try {
    const [vehicles, cats] = await Promise.all([listVehicles(), listCategoriesInStock()]);
    return [
      ...pages,
      ...cats.map((c) => ({ url: `${base}/fleet?category=${c.category}`, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...vehicles.map((v) => ({ url: `${base}/fleet/${v.slug}`, lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ];
  } catch {
    return pages;
  }
}
