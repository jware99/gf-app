export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validate an uploaded receipt image before it ever reaches the AI
 * provider: reject anything over 10MB, reject non-image MIME types
 * (spec §7).
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      message: `Unsupported file type "${file.type || "unknown"}". Upload a JPEG, PNG, GIF, or WebP image.`,
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "File exceeds 10MB limit." };
  }
  return { ok: true };
}
