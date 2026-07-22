export interface ExtractedItem {
  name: string;
  price: number;
  likelyGlutenFree: boolean;
}

export interface EquivalentEstimate {
  name: string;
  estimatedRegularPrice: number;
}

/**
 * AI provider contract. Services and route handlers depend only on this
 * interface (resolved via lib/container.ts), never on AnthropicProvider
 * directly — swapping models/providers should mean writing one new file
 * that implements this interface, called only from src/app/api/** or
 * src/lib/ai/**.
 */
export interface AIProvider {
  extractReceiptItems(
    imageBase64: string,
    mediaType: string,
  ): Promise<ExtractedItem[]>;
  estimateEquivalentPrices(
    items: { name: string; purchasedPrice: number }[],
  ): Promise<EquivalentEstimate[]>;
}
