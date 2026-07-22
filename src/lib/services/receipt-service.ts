import type { AIProvider, ExtractedItem } from "@/lib/ai/ai-provider";
import type { Receipt, ReceiptRepository } from "@/lib/db/receipt-repository";

/**
 * Orchestrates the AIProvider and ReceiptRepository interfaces plus the
 * pure deduction-calculator functions. Has no I/O of its own — every
 * external call is delegated to the injected interfaces, so this class is
 * easy to test with both interfaces mocked. Route handlers call this, and
 * only this, for receipt/AGI business logic.
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

  getLedger(year?: number): Promise<Receipt[]> {
    return this.receiptRepository.list(year);
  }

  saveReceipt(
    receipt: Omit<Receipt, "id" | "createdAt">,
  ): Promise<Receipt> {
    return this.receiptRepository.create(receipt);
  }

  deleteReceipt(id: string): Promise<void> {
    return this.receiptRepository.delete(id);
  }

  async getAgiForYear(year: number): Promise<number> {
    const agi = await this.receiptRepository.getAgiForYear(year);
    return agi ?? 0;
  }

  setAgiForYear(year: number, agi: number): Promise<void> {
    return this.receiptRepository.setAgiForYear(year, agi);
  }
}
