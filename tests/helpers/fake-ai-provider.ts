import type {
  AIProvider,
  EquivalentEstimate,
  ExtractedItem,
} from "@/lib/ai/ai-provider";

/**
 * Mocked AIProvider for route integration tests — the point is testing the
 * route's validation and error handling, not re-testing Anthropic's API
 * (spec §9).
 */
export class FakeAIProvider implements AIProvider {
  async extractReceiptItems(): Promise<ExtractedItem[]> {
    return [{ name: "GF Sandwich Bread", price: 6.49, likelyGlutenFree: true }];
  }

  async estimateEquivalentPrices(
    items: { name: string; purchasedPrice: number }[],
  ): Promise<EquivalentEstimate[]> {
    return items.map((item) => ({
      name: item.name,
      estimatedRegularPrice: Math.max(0, item.purchasedPrice - 3),
    }));
  }
}
