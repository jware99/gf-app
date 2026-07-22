import { NextRequest, NextResponse } from "next/server";
import { getReceiptService } from "@/lib/container";
import { validateImageFile } from "@/lib/validation/image";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { apiError, internalError, rateLimitedError } from "@/lib/api-error";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `extract:${clientKeyFromRequest(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!rateLimit.allowed) return rateLimitedError();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(400, "INVALID_FORM_DATA", "Expected multipart/form-data.");
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return apiError(400, "MISSING_IMAGE", 'Expected a file in the "image" field.');
  }

  const validation = validateImageFile(image);
  if (!validation.ok) {
    return apiError(400, "INVALID_IMAGE", validation.message);
  }

  try {
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const items = await getReceiptService().extractItemsFromImage(
      base64,
      image.type,
    );
    return NextResponse.json({ items });
  } catch {
    return internalError("Could not read that receipt image.");
  }
}
