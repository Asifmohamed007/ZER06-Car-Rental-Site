export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Detects the real image type from file signature bytes; never trusts the file name or browser MIME type. */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export function validateUpload(bytes: Uint8Array): { ok: true; mime: string } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be 5 MB or smaller." };
  const mime = sniffImageType(bytes);
  if (!mime) return { ok: false, error: "Upload a JPEG, PNG or WebP image." };
  return { ok: true, mime };
}
