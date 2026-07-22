import type { Receipt, ReceiptRepository } from "@/lib/db/receipt-repository";

let nextId = 1;

interface StoredReceipt extends Receipt {
  userId: string;
}

/**
 * In-memory ReceiptRepository test double — stands in for the real
 * Postgres/SQLite database in route integration tests, per spec §9
 * ("mocked AIProvider and an in-memory/test database"). Scoped by userId
 * the same way PrismaReceiptRepository is.
 */
export class FakeReceiptRepository implements ReceiptRepository {
  private receipts: StoredReceipt[] = [];
  private agiByUserYear = new Map<string, number>();

  private key(userId: string, year: number): string {
    return `${userId}:${year}`;
  }

  async list(userId: string, year?: number): Promise<Receipt[]> {
    return this.receipts.filter(
      (r) =>
        r.userId === userId &&
        (year === undefined || new Date(r.date).getUTCFullYear() === year),
    );
  }

  async create(
    userId: string,
    receipt: Omit<Receipt, "id" | "createdAt">,
  ): Promise<Receipt> {
    const created: StoredReceipt = {
      ...receipt,
      id: `fake-${nextId++}`,
      createdAt: new Date().toISOString(),
      userId,
    };
    this.receipts.push(created);
    return {
      id: created.id,
      store: created.store,
      date: created.date,
      items: created.items,
      createdAt: created.createdAt,
    };
  }

  async delete(userId: string, id: string): Promise<void> {
    const before = this.receipts.length;
    this.receipts = this.receipts.filter((r) => !(r.id === id && r.userId === userId));
    if (this.receipts.length === before) {
      const error = new Error("Record not found") as Error & { code?: string };
      error.code = "P2025";
      throw error;
    }
  }

  async getAgiForYear(userId: string, year: number): Promise<number | null> {
    return this.agiByUserYear.get(this.key(userId, year)) ?? null;
  }

  async setAgiForYear(userId: string, year: number, agi: number): Promise<void> {
    this.agiByUserYear.set(this.key(userId, year), agi);
  }

  async claimOrphanedReceipts(): Promise<void> {
    // No unclaimed rows exist in this in-memory test double; every fake
    // receipt/AGI setting is already created with a userId.
  }
}
