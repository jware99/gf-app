import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptService } from "@/lib/container";
import { estimateRequestSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, internalError, rateLimitedError, unauthorizedError, validationError } from "@/lib/api-error";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedError();

  const rateLimit = checkRateLimit(`estimate:${session.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) return rateLimitedError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = estimateRequestSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const estimates = await getReceiptService().estimateRegularPrices(parsed.data.items);
    const items = parsed.data.items.map((item) => ({
      name: item.name,
      estimatedRegularPrice: estimates.get(item.name) ?? 0,
    }));
    return NextResponse.json({ items });
  } catch {
    return internalError("Could not estimate regular prices.");
  }
}
