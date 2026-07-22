import { NextResponse } from "next/server";
import { getReceiptService } from "@/lib/container";
import { apiError, internalError, notFoundError } from "@/lib/api-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return apiError(400, "VALIDATION_ERROR", "Receipt id is required.");
  }

  try {
    await getReceiptService().deleteReceipt(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Prisma throws when the record to delete doesn't exist (P2025).
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return notFoundError(`No receipt found with id "${id}".`);
    }
    return internalError("Could not delete receipt.");
  }
}
