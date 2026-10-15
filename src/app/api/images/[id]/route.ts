import { getImageData } from "@/server/vehicles";
import { logError } from "@/server/log";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!/^\d{1,18}$/.test(params.id)) return new Response("Not found", { status: 404 });
  try {
    const img = await getImageData(Number(params.id));
    if (!img) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(img.data), {
      headers: {
        "Content-Type": img.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (e) {
    logError("image.failed", e);
    return new Response("Unavailable", { status: 503 });
  }
}
