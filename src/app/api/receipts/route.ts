import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptService } from "@/lib/container";
import { createReceiptSchema, listReceiptsQuerySchema } from "@/lib/validation/schemas";
import { apiError, internalError, unauthorizedError, validationError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedError();

  const query = listReceiptsQuerySchema.safeParse({
    year: request.nextUrl.searchParams.get("year") ?? undefined,
  });
  if (!query.success) return validationError(query.error);

  try {
    const receipts = await getReceiptService().getLedger(session.user.id, query.data.year);
    return NextResponse.json({ receipts });
  } catch {
    return internalError("Could not load receipts.");
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const receipt = await getReceiptService().saveReceipt(session.user.id, parsed.data);
    return NextResponse.json({ receipt }, { status: 201 });
  } catch {
    return internalError("Could not save receipt.");
  }
}
