import type { Receipt, ReceiptRepository } from "@/lib/db/receipt-repository";

let nextId = 1;

/**
 * In-memory ReceiptRepository test double — stands in for the real
 * Postgres/SQLite database in route integration tests, per spec §9
 * ("mocked AIProvider and an in-memory/test database").
 */
export class FakeReceiptRepository implements ReceiptRepository {
  private receipts: Receipt[] = [];
  private agiByYear = new Map<number, number>();

  async list(year?: number): Promise<Receipt[]> {
    if (year === undefined) return [...this.receipts];
    return this.receipts.filter(
      (r) => new Date(r.date).getUTCFullYear() === year,
    );
  }

  async create(receipt: Omit<Receipt, "id" | "createdAt">): Promise<Receipt> {
    const created: Receipt = {
      ...receipt,
      id: `fake-${nextId++}`,
      createdAt: new Date().toISOString(),
    };
    this.receipts.push(created);
    return created;
  }

  async delete(id: string): Promise<void> {
    const before = this.receipts.length;
    this.receipts = this.receipts.filter((r) => r.id !== id);
    if (this.receipts.length === before) {
      const error = new Error("Record not found") as Error & { code?: string };
      error.code = "P2025";
      throw error;
    }
  }

  async getAgiForYear(year: number): Promise<number | null> {
    return this.agiByYear.get(year) ?? null;
  }

  async setAgiForYear(year: number, agi: number): Promise<void> {
    this.agiByYear.set(year, agi);
  }
}
