import type { Receipt, ReceiptItem } from "@/lib/db/receipt-repository";
import type { EquivalentEstimate, ExtractedItem } from "@/lib/ai/ai-provider";

export type { Receipt, ReceiptItem, ExtractedItem, EquivalentEstimate };

/**
 * A single row in the "review before saving" draft — string-typed number
 * fields so inputs can be controlled and momentarily empty/invalid while
 * the user is typing, matching the prototype's draft item shape.
 */
export interface DraftItem {
  id: string;
  name: string;
  price: string;
  isGlutenFree: boolean;
  regularPrice: string;
}

export interface ReceiptDraft {
  store: string;
  date: string; // ISO date, YYYY-MM-DD
  items: DraftItem[];
}
