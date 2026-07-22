"use client";

import { useEffect, useRef, useState } from "react";
import type { DraftItem, EquivalentEstimate, ExtractedItem, ReceiptItem } from "@/types";
import { ReviewTable } from "@/components/modal/ReviewTable";

type ModalMode = "upload" | "loading" | "review";

function blankItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    isGlutenFree: false,
    regularPrice: "",
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onExtract: (file: File) => Promise<ExtractedItem[]>;
  onEstimate: (
    items: { name: string; purchasedPrice: number }[],
  ) => Promise<EquivalentEstimate[]>;
  onSave: (receipt: { store: string; date: string; items: ReceiptItem[] }) => Promise<void>;
}

export function AddReceiptModal({
  open,
  onClose,
  onExtract,
  onEstimate,
  onSave,
}: AddReceiptModalProps) {
  const [mode, setMode] = useState<ModalMode>("upload");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [store, setStore] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMode("upload");
      setStore("");
      setDate(todayIsoDate());
      setItems([]);
      setError(null);
      setSaving(false);
      dialogRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const dialogTitle =
    mode === "upload" ? "Add a receipt" : mode === "review" ? "Review before saving" : "Working…";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMode("loading");
    setLoadingMessage("Reading items off your receipt…");
    setError(null);

    try {
      const extracted = await onExtract(file);
      if (extracted.length === 0) {
        setItems([blankItem()]);
        setError(
          "Couldn't confidently read that receipt — an item was added blank so you can fill it in.",
        );
        setMode("review");
        return;
      }

      const draftItems: DraftItem[] = extracted.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        price: item.price ? String(item.price) : "",
        isGlutenFree: item.likelyGlutenFree,
        regularPrice: "",
      }));
      setItems(draftItems);
      setMode("review");

      const gfItems = draftItems.filter((i) => i.isGlutenFree);
      if (gfItems.length > 0) {
        await runEstimate(draftItems, { silent: true });
      }
    } catch {
      setItems((prev) => (prev.length > 0 ? prev : [blankItem()]));
      setError("Something went wrong reading the image. You can enter items by hand below.");
      setMode("review");
    }
  }

  async function runEstimate(
    currentItems: DraftItem[],
    { silent = false }: { silent?: boolean } = {},
  ) {
    const gfItems = currentItems.filter((i) => i.isGlutenFree && i.name);
    if (gfItems.length === 0) {
      if (!silent) setError("Mark at least one item as gluten-free first.");
      return;
    }

    if (!silent) {
      setMode("loading");
      setLoadingMessage("Estimating typical prices for the regular equivalents…");
    }

    try {
      const estimates = await onEstimate(
        gfItems.map((i) => ({ name: i.name, purchasedPrice: Number(i.price) || 0 })),
      );
      const byName = new Map(estimates.map((e) => [e.name, e.estimatedRegularPrice]));
      setItems((prev) =>
        prev.map((item) =>
          item.isGlutenFree && byName.has(item.name)
            ? { ...item, regularPrice: String(byName.get(item.name)) }
            : item,
        ),
      );
      if (!silent) setError(null);
    } catch {
      setError("Couldn't estimate equivalents automatically — you can enter regular prices by hand.");
    } finally {
      setMode("review");
    }
  }

  async function handleSave() {
    const valid = items.filter((i) => i.name && i.price !== "");
    if (valid.length === 0) {
      setError("Add at least one item with a name and price.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        store,
        date,
        items: valid.map((i) => ({
          name: i.name,
          price: Number(i.price) || 0,
          isGlutenFree: i.isGlutenFree,
          regularPrice: Number(i.regularPrice) || 0,
        })),
      });
      onClose();
    } catch {
      setError("Couldn't save this receipt. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogTitle}
        tabIndex={-1}
        className="max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-lg border border-rule bg-paper-raised p-6 focus:outline-none"
      >
        {mode === "upload" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-mono text-base font-bold">Add a receipt</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="border-none bg-transparent text-xl leading-none text-ink-soft"
              >
                &times;
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-3.5 w-full rounded-md border-2 border-dashed border-rule px-6 py-6 text-center hover:border-fern"
            >
              <div className="mb-1.5 text-[28px]">📷</div>
              <div className="text-sm font-semibold">Tap to photograph or upload a receipt</div>
              <div className="mt-1 text-xs text-ink-soft">
                We&rsquo;ll read the items and prices automatically
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => {
                setItems([blankItem()]);
                setMode("review");
              }}
              className="mb-3.5 block w-full text-center text-sm text-fern underline"
            >
              Or enter items by hand
            </button>
          </>
        )}

        {mode === "loading" && (
          <div className="py-6 text-center text-sm text-ink-soft" role="status" aria-live="polite">
            <div
              aria-hidden="true"
              className="mx-auto mb-2.5 h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-rule border-t-fern"
            />
            {loadingMessage}
          </div>
        )}

        {mode === "review" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-mono text-base font-bold">Review before saving</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="border-none bg-transparent text-xl leading-none text-ink-soft"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded bg-berry/10 px-2.5 py-2 text-[13px] text-berry" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3.5">
              <label
                htmlFor="ct-store-input"
                className="mb-1 block font-mono text-xs tracking-wide text-ink-soft"
              >
                Store
              </label>
              <input
                id="ct-store-input"
                type="text"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                placeholder="e.g. Trader Joe's"
                className="w-full rounded border-[1.5px] border-rule bg-white px-2.5 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-fern"
              />
            </div>

            <div className="mb-3.5">
              <label
                htmlFor="ct-date-input"
                className="mb-1 block font-mono text-xs tracking-wide text-ink-soft"
              >
                Date
              </label>
              <input
                id="ct-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border-[1.5px] border-rule bg-white px-2.5 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-fern"
              />
            </div>

            <div className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-ink-soft">
              Items
            </div>
            <ReviewTable items={items} onChange={setItems} />

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, blankItem()])}
                className="rounded-[3px] border-[1.5px] border-ink px-2.5 py-1.5 text-xs font-semibold"
              >
                + Add item
              </button>
              <button
                type="button"
                onClick={() => runEstimate(items)}
                className="rounded-[3px] border-[1.5px] border-ink px-2.5 py-1.5 text-xs font-semibold"
              >
                Estimate GF equivalents
              </button>
            </div>

            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[3px] border-[1.5px] border-ink px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-[3px] bg-fern px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_0_#365c30] transition-transform active:translate-y-px disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save to ledger"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
