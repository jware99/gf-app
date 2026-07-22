import type { AIProvider, ExtractedItem } from "@/lib/ai/ai-provider";
import type { Receipt, ReceiptRepository } from "@/lib/db/receipt-repository";

/**
 * Orchestrates the AIProvider and ReceiptRepository interfaces plus the
 * pure deduction-calculator functions. Has no I/O of its own — every
 * external call is delegated to the injected interfaces, so this class is
 * easy to test with both interfaces mocked. Route handlers call this, and
 * only this, for receipt/AGI business logic.
 *
 * `userId` is threaded through every data-access method — it always comes
 * from the caller's `auth()` session, never from client input.
 */
export class ReceiptService {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly receiptRepository: ReceiptRepository,
  ) {}

  extractItemsFromImage(
    imageBase64: string,
    mediaType: string,
  ): Promise<ExtractedItem[]> {
    return this.aiProvider.extractReceiptItems(imageBase64, mediaType);
  }

  async estimateRegularPrices(
    items: { name: string; purchasedPrice: number }[],
  ): Promise<Map<string, number>> {
    const estimates = await this.aiProvider.estimateEquivalentPrices(items);
    return new Map(estimates.map((e) => [e.name, e.estimatedRegularPrice]));
  }

  getLedger(userId: string, year?: number): Promise<Receipt[]> {
    return this.receiptRepository.list(userId, year);
  }

  saveReceipt(
    userId: string,
    receipt: Omit<Receipt, "id" | "createdAt">,
  ): Promise<Receipt> {
    return this.receiptRepository.create(userId, receipt);
  }

  deleteReceipt(userId: string, id: string): Promise<void> {
    return this.receiptRepository.delete(userId, id);
  }

  async getAgiForYear(userId: string, year: number): Promise<number> {
    const agi = await this.receiptRepository.getAgiForYear(userId, year);
    return agi ?? 0;
  }

  setAgiForYear(userId: string, year: number, agi: number): Promise<void> {
    return this.receiptRepository.setAgiForYear(userId, year, agi);
  }
}
