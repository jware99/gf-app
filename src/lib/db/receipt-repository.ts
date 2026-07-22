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
 *
 * Every method is scoped to a signed-in user's `userId` — callers (routes)
 * get it from `auth()`, never from client input, so one user can never
 * read/modify another's data. `delete` must verify ownership, not just id.
 */
export interface ReceiptRepository {
  list(userId: string, year?: number): Promise<Receipt[]>;
  create(
    userId: string,
    receipt: Omit<Receipt, "id" | "createdAt">,
  ): Promise<Receipt>;
  delete(userId: string, id: string): Promise<void>;
  getAgiForYear(userId: string, year: number): Promise<number | null>;
  setAgiForYear(userId: string, year: number, agi: number): Promise<void>;
  /**
   * One-time migration hook: assigns every pre-auth row (userId IS NULL)
   * to `userId`. Called from auth.ts's `events.createUser`, exactly once,
   * the first time any account ever signs in.
   */
  claimOrphanedReceipts(userId: string): Promise<void>;
}
