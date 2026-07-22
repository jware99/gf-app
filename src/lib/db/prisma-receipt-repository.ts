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
  async list(year?: number): Promise<Receipt[]> {
    const receipts = await prisma.receipt.findMany({
      where: year !== undefined ? { date: yearRange(year) } : undefined,
      include: { items: true },
      orderBy: { date: "desc" },
    });
    return receipts.map(toReceipt);
  }

  async create(receipt: Omit<Receipt, "id" | "createdAt">): Promise<Receipt> {
    const created = await prisma.receipt.create({
      data: {
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

  async delete(id: string): Promise<void> {
    await prisma.receipt.delete({ where: { id } });
  }

  async getAgiForYear(year: number): Promise<number | null> {
    const setting = await prisma.yearSetting.findUnique({ where: { year } });
    return setting ? setting.agi : null;
  }

  async setAgiForYear(year: number, agi: number): Promise<void> {
    await prisma.yearSetting.upsert({
      where: { year },
      create: { year, agi },
      update: { agi },
    });
  }
}
