import { describe, expect, it } from "vitest";
import {
  deductibleAmount,
  floorAmount,
  itemDelta,
  receiptDelta,
  yearTotal,
} from "@/lib/services/deduction-calculator";
import type { Receipt, ReceiptItem } from "@/lib/db/receipt-repository";

function makeItem(overrides: Partial<ReceiptItem> = {}): ReceiptItem {
  return {
    name: "GF Sandwich Bread",
    price: 6.49,
    isGlutenFree: true,
    regularPrice: 3.29,
    ...overrides,
  };
}

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "r1",
    store: "Trader Joe's",
    date: "2026-01-01",
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [],
    ...overrides,
  };
}

describe("itemDelta", () => {
  it("is zero for a non-gluten-free item, regardless of price fields", () => {
    expect(itemDelta(makeItem({ isGlutenFree: false, price: 5, regularPrice: 1 }))).toBe(0);
  });

  it("is the price difference for a gluten-free item priced above its regular equivalent", () => {
    expect(itemDelta(makeItem({ price: 6.49, regularPrice: 3.29 }))).toBeCloseTo(3.2);
  });

  it("clamps to zero when the gluten-free item is priced at or below its regular equivalent (never a negative deduction)", () => {
    expect(itemDelta(makeItem({ price: 2, regularPrice: 5 }))).toBe(0);
    expect(itemDelta(makeItem({ price: 5, regularPrice: 5 }))).toBe(0);
  });
});

describe("receiptDelta / yearTotal", () => {
  it("is zero for a receipt with no items (empty case)", () => {
    expect(receiptDelta(makeReceipt({ items: [] }))).toBe(0);
  });

  it("sums per-item deltas across a receipt, ignoring non-GF items", () => {
    const receipt = makeReceipt({
      items: [
        makeItem({ price: 6.49, regularPrice: 3.29 }),
        makeItem({ name: "Bananas", isGlutenFree: false, price: 1.2, regularPrice: 0 }),
      ],
    });
    expect(receiptDelta(receipt)).toBeCloseTo(3.2);
  });

  it("sums receipt deltas across multiple receipts for a year total", () => {
    const receipts = [
      makeReceipt({ items: [makeItem({ price: 6.49, regularPrice: 3.29 })] }),
      makeReceipt({ items: [makeItem({ price: 5, regularPrice: 2 })] }),
    ];
    expect(yearTotal(receipts)).toBeCloseTo(6.2);
  });

  it("is zero for an empty list of receipts", () => {
    expect(yearTotal([])).toBe(0);
  });
});

describe("floorAmount", () => {
  it("is zero for zero AGI (zero/empty case)", () => {
    expect(floorAmount(0)).toBe(0);
  });

  it("is 7.5% of AGI for a normal case", () => {
    expect(floorAmount(60000)).toBeCloseTo(4500);
  });

  it("clamps to zero for a negative AGI (defensive boundary case)", () => {
    expect(floorAmount(-1000)).toBe(0);
  });
});

describe("deductibleAmount", () => {
  it("is zero when total is under the floor", () => {
    expect(deductibleAmount(100, 4500)).toBe(0);
  });

  it("is the excess when total is over the floor (normal case)", () => {
    expect(deductibleAmount(5000, 4500)).toBeCloseTo(500);
  });

  it("is zero at exactly the floor (boundary case)", () => {
    expect(deductibleAmount(4500, 4500)).toBe(0);
  });

  it("clamps to zero rather than going negative when floor exceeds total", () => {
    expect(deductibleAmount(100, 200)).toBe(0);
  });
});
