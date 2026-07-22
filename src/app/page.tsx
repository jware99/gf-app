"use client";

import { useMemo, useState } from "react";
import type { EquivalentEstimate, ExtractedItem, Receipt, ReceiptItem } from "@/types";
import { YearSelect } from "@/components/ledger/YearSelect";
import { ReceiptList } from "@/components/ledger/ReceiptList";
import { DeductionTape } from "@/components/tape/DeductionTape";
import { AddReceiptModal } from "@/components/modal/AddReceiptModal";
import { yearTotal } from "@/lib/services/deduction-calculator";

const currentYear = new Date().getFullYear();

// Mock seed data — proves the components render/interact correctly before
// Phase 7 wires them to the real API routes.
const MOCK_RECEIPTS: Receipt[] = [
  {
    id: "mock-1",
    store: "Trader Joe's",
    date: `${currentYear}-03-15`,
    createdAt: `${currentYear}-03-15T00:00:00.000Z`,
    items: [
      { name: "GF Sandwich Bread", price: 6.49, isGlutenFree: true, regularPrice: 3.29 },
      { name: "Bananas", price: 1.2, isGlutenFree: false, regularPrice: 0 },
    ],
  },
  {
    id: "mock-2",
    store: "Sprouts",
    date: `${currentYear}-02-02`,
    createdAt: `${currentYear}-02-02T00:00:00.000Z`,
    items: [{ name: "GF Pasta", price: 4.99, isGlutenFree: true, regularPrice: 1.79 }],
  },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function mockDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockExtract(file: File): Promise<ExtractedItem[]> {
  void file;
  await mockDelay(600);
  return [
    { name: "GF Sandwich Bread", price: 6.49, likelyGlutenFree: true },
    { name: "Bananas", price: 1.2, likelyGlutenFree: false },
  ];
}

async function mockEstimate(
  items: { name: string; purchasedPrice: number }[],
): Promise<EquivalentEstimate[]> {
  await mockDelay(500);
  return items.map((item) => ({
    name: item.name,
    estimatedRegularPrice: Math.max(0, Math.round((item.purchasedPrice - 3.2) * 100) / 100),
  }));
}

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);
  const [agiByYear, setAgiByYear] = useState<Record<number, number>>({});
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const years = useMemo(() => {
    const set = new Set<number>([selectedYear]);
    receipts.forEach((r) => set.add(new Date(r.date).getFullYear()));
    Object.keys(agiByYear).forEach((y) => set.add(Number(y)));
    return Array.from(set).sort((a, b) => b - a);
  }, [receipts, agiByYear, selectedYear]);

  const receiptsForYear = useMemo(
    () => receipts.filter((r) => new Date(r.date).getFullYear() === selectedYear),
    [receipts, selectedYear],
  );

  const total = useMemo(() => yearTotal(receiptsForYear), [receiptsForYear]);

  async function handleSave(receipt: { store: string; date: string; items: ReceiptItem[] }) {
    await mockDelay(400);
    setReceipts((prev) => [
      ...prev,
      { ...receipt, id: uid(), createdAt: new Date().toISOString() },
    ]);
    setSelectedYear(new Date(receipt.date).getFullYear());
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-7 text-ink">
      <div className="mx-auto mb-7 flex max-w-[1080px] flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight">
            Crumb <span className="text-fern">Trail</span>
          </h1>
          <p className="mt-1.5 max-w-[440px] text-sm text-ink-soft">
            Photograph gluten-free grocery receipts. We&rsquo;ll estimate the extra cost
            over the regular product, so you can track it toward your celiac
            medical-expense deduction.
          </p>
        </div>
        <YearSelect years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
      </div>

      <div className="mx-auto grid max-w-[1080px] gap-7 md:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[2px] text-ink-soft">
              Ledger
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-[3px] bg-fern px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_0_#365c30] transition-transform active:translate-y-px"
            >
              + Add receipt
            </button>
          </div>
          <ReceiptList
            receipts={receiptsForYear}
            year={selectedYear}
            openReceiptId={openReceiptId}
            onToggle={(id) => setOpenReceiptId((prev) => (prev === id ? null : id))}
            onDelete={(id) => setReceipts((prev) => prev.filter((r) => r.id !== id))}
          />
        </div>

        <div className="order-first md:order-none">
          <div className="sticky top-5">
            <DeductionTape
              agi={agiByYear[selectedYear] ?? 0}
              onAgiChange={(agi) =>
                setAgiByYear((prev) => ({ ...prev, [selectedYear]: agi }))
              }
              total={total}
            />
          </div>
        </div>
      </div>

      <AddReceiptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onExtract={mockExtract}
        onEstimate={mockEstimate}
        onSave={handleSave}
      />
    </main>
  );
}
