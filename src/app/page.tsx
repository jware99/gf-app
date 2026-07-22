"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Receipt, ReceiptItem } from "@/types";
import { YearSelect } from "@/components/ledger/YearSelect";
import { ReceiptList } from "@/components/ledger/ReceiptList";
import { DeductionTape } from "@/components/tape/DeductionTape";
import { AddReceiptModal } from "@/components/modal/AddReceiptModal";
import { yearTotal } from "@/lib/services/deduction-calculator";
import {
  ApiClientError,
  createReceipt,
  deleteReceipt,
  estimateEquivalentPrices,
  extractReceiptItems,
  fetchReceipts,
  getAgiForYear,
  setAgiForYear,
} from "@/lib/api-client";

const currentYear = new Date().getFullYear();
const AGI_SAVE_DEBOUNCE_MS = 400;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback;
}

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);

  const [agiByYear, setAgiByYear] = useState<Record<number, number>>({});
  const [agiError, setAgiError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const agiSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReceipts = useCallback(async () => {
    setReceiptsLoading(true);
    setReceiptsError(null);
    try {
      const data = await fetchReceipts();
      setReceipts(data);
    } catch (err) {
      setReceiptsError(errorMessage(err, "Could not load your receipts."));
    } finally {
      setReceiptsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    if (selectedYear in agiByYear) return;
    let cancelled = false;
    getAgiForYear(selectedYear)
      .then((agi) => {
        if (!cancelled) setAgiByYear((prev) => ({ ...prev, [selectedYear]: agi }));
      })
      .catch((err) => {
        if (!cancelled) setAgiError(errorMessage(err, "Could not load AGI for that year."));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedYear, agiByYear]);

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

  function handleAgiChange(agi: number) {
    setAgiError(null);
    setAgiByYear((prev) => ({ ...prev, [selectedYear]: agi }));

    if (agiSaveTimer.current) clearTimeout(agiSaveTimer.current);
    agiSaveTimer.current = setTimeout(async () => {
      try {
        await setAgiForYear(selectedYear, agi);
      } catch (err) {
        setAgiError(errorMessage(err, "Could not save AGI for that year."));
      }
    }, AGI_SAVE_DEBOUNCE_MS);
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteReceipt(id);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setActionError(errorMessage(err, "Could not delete that receipt."));
    }
  }

  async function handleSave(receipt: { store: string; date: string; items: ReceiptItem[] }) {
    const saved = await createReceipt(receipt);
    setReceipts((prev) => [...prev, saved]);
    setSelectedYear(new Date(saved.date).getFullYear());
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

      {(receiptsError || agiError || actionError) && (
        <div className="mx-auto mb-4 max-w-[1080px] rounded bg-berry/10 px-3 py-2 text-sm text-berry" role="alert">
          {receiptsError || agiError || actionError}
        </div>
      )}

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
          {receiptsLoading ? (
            <div className="py-9 text-center text-sm text-ink-soft" role="status" aria-live="polite">
              Loading receipts…
            </div>
          ) : (
            <ReceiptList
              receipts={receiptsForYear}
              year={selectedYear}
              openReceiptId={openReceiptId}
              onToggle={(id) => setOpenReceiptId((prev) => (prev === id ? null : id))}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="order-first md:order-none">
          <div className="sticky top-5">
            <DeductionTape
              agi={agiByYear[selectedYear] ?? 0}
              onAgiChange={handleAgiChange}
              total={total}
            />
          </div>
        </div>
      </div>

      <AddReceiptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onExtract={extractReceiptItems}
        onEstimate={estimateEquivalentPrices}
        onSave={handleSave}
      />
    </main>
  );
}
