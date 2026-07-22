import type { Receipt, ReceiptItem } from "@/lib/db/receipt-repository";

const AGI_FLOOR_RATE = 0.075;

/**
 * Pure business logic for the celiac medical-expense deduction. No I/O —
 * unit-testable with zero mocking. Ported from the prototype's
 * receiptDelta / floor / deductible math, with prices clamped to zero so a
 * non-GF item, or a GF item priced below its regular equivalent, never
 * produces a negative deduction.
 */
export function itemDelta(item: ReceiptItem): number {
  if (!item.isGlutenFree) return 0;
  return Math.max(0, item.price - item.regularPrice);
}

export function receiptDelta(receipt: Receipt): number {
  return receipt.items.reduce((sum, item) => sum + itemDelta(item), 0);
}

export function yearTotal(receipts: Receipt[]): number {
  return receipts.reduce((sum, receipt) => sum + receiptDelta(receipt), 0);
}

export function floorAmount(agi: number): number {
  return Math.max(0, agi) * AGI_FLOOR_RATE;
}

export function deductibleAmount(total: number, floor: number): number {
  return Math.max(0, total - floor);
}
