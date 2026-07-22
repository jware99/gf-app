import { NextRequest, NextResponse } from "next/server";
import { getReceiptService } from "@/lib/container";
import { agiSettingQuerySchema, putAgiSettingSchema } from "@/lib/validation/schemas";
import { apiError, internalError, validationError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const query = agiSettingQuerySchema.safeParse({
    year: request.nextUrl.searchParams.get("year") ?? undefined,
  });
  if (!query.success) return validationError(query.error);

  try {
    const agi = await getReceiptService().getAgiForYear(query.data.year);
    return NextResponse.json({ year: query.data.year, agi: agi ?? 0 });
  } catch {
    return internalError("Could not load AGI for that year.");
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = putAgiSettingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await getReceiptService().setAgiForYear(parsed.data.year, parsed.data.agi);
    return NextResponse.json({ year: parsed.data.year, agi: parsed.data.agi });
  } catch {
    return internalError("Could not save AGI for that year.");
  }
}
