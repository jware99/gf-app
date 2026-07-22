import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptService } from "@/lib/container";
import { apiError, internalError, notFoundError, unauthorizedError } from "@/lib/api-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return unauthorizedError();

  const { id } = await params;
  if (!id) {
    return apiError(400, "VALIDATION_ERROR", "Receipt id is required.");
  }

  try {
    await getReceiptService().deleteReceipt(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Prisma throws when the record to delete doesn't exist (P2025) — also
    // what our repository throws when the id belongs to another user.
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
