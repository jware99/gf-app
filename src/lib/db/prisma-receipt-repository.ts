import { prisma } from "@/lib/db/prisma";
import type {
  Receipt,
  ReceiptItem,
  ReceiptRepository,
} from "@/lib/db/receipt-repository";
import type {
  Receipt as PrismaReceipt,
  ReceiptItem as PrismaReceiptItem,
} from "@prisma/client";

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toReceiptItem(item: PrismaReceiptItem): ReceiptItem {
  return {
    name: item.name,
    price: item.price,
    isGlutenFree: item.isGlutenFree,
    regularPrice: item.regularPrice,
  };
}

function toReceipt(
  receipt: PrismaReceipt & { items: PrismaReceiptItem[] },
): Receipt {
  return {
    id: receipt.id,
    store: receipt.store,
    date: toDateOnlyString(receipt.date),
    items: receipt.items.map(toReceiptItem),
    createdAt: receipt.createdAt.toISOString(),
  };
}

function yearRange(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(`${year}-01-01T00:00:00.000Z`),
    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
  };
}

export class PrismaReceiptRepository implements ReceiptRepository {
  async list(userId: string, year?: number): Promise<Receipt[]> {
    const receipts = await prisma.receipt.findMany({
      where: {
        userId,
        ...(year !== undefined ? { date: yearRange(year) } : {}),
      },
      include: { items: true },
      orderBy: { date: "desc" },
    });
    return receipts.map(toReceipt);
  }

  async create(
    userId: string,
    receipt: Omit<Receipt, "id" | "createdAt">,
  ): Promise<Receipt> {
    const created = await prisma.receipt.create({
      data: {
        userId,
        store: receipt.store,
        date: new Date(receipt.date),
        items: {
          create: receipt.items.map((item) => ({
            name: item.name,
            price: item.price,
            isGlutenFree: item.isGlutenFree,
            regularPrice: item.regularPrice,
          })),
        },
      },
      include: { items: true },
    });
    return toReceipt(created);
  }

  async delete(userId: string, id: string): Promise<void> {
    // deleteMany (not delete) so a receipt owned by someone else fails as
    // "not found" rather than leaking whether the id exists at all.
    const { count } = await prisma.receipt.deleteMany({
      where: { id, userId },
    });
    if (count === 0) {
      const error = new Error("Record not found") as Error & { code?: string };
      error.code = "P2025";
      throw error;
    }
  }

  async getAgiForYear(userId: string, year: number): Promise<number | null> {
    const setting = await prisma.yearSetting.findUnique({
      where: { userId_year: { userId, year } },
    });
    return setting ? setting.agi : null;
  }

  async setAgiForYear(userId: string, year: number, agi: number): Promise<void> {
    await prisma.yearSetting.upsert({
      where: { userId_year: { userId, year } },
      create: { userId, year, agi },
      update: { agi },
    });
  }

  async claimOrphanedReceipts(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.receipt.updateMany({
        where: { userId: null },
        data: { userId },
      }),
      // Two unclaimed YearSetting rows for the same year can't collide
      // with `@@unique([userId, year])` while userId is null (NULL != NULL
      // in SQL uniqueness), but they could collide once claimed onto the
      // same userId. There's at most one legacy row per year in practice,
      // so a plain updateMany is safe; skipDuplicates isn't available on
      // updateMany, so this assumes that invariant holds.
      prisma.yearSetting.updateMany({
        where: { userId: null },
        data: { userId },
      }),
    ]);
  }
}
