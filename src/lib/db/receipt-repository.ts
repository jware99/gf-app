export interface ReceiptItem {
  name: string;
  price: number;
  isGlutenFree: boolean;
  regularPrice: number;
}

export interface Receipt {
  id: string;
  store: string;
  date: string; // ISO date
  items: ReceiptItem[];
  createdAt: string;
}

/**
 * Data access contract for receipts and per-year AGI settings. Services and
 * route handlers depend only on this interface (resolved via
 * lib/container.ts), never on PrismaReceiptRepository or PrismaClient
 * directly — swapping SQLite for Postgres, or Prisma for another store,
 * should mean writing one new file that implements this interface.
 */
export interface ReceiptRepository {
  list(year?: number): Promise<Receipt[]>;
  create(receipt: Omit<Receipt, "id" | "createdAt">): Promise<Receipt>;
  delete(id: string): Promise<void>;
  getAgiForYear(year: number): Promise<number | null>;
  setAgiForYear(year: number, agi: number): Promise<void>;
}
