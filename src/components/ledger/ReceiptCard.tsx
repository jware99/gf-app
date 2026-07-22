"use client";

import type { Receipt } from "@/types";
import { receiptDelta } from "@/lib/services/deduction-calculator";
import { formatCurrency } from "@/lib/format";

interface ReceiptCardProps {
  receipt: Receipt;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReceiptCard({ receipt, isOpen, onToggle, onDelete }: ReceiptCardProps) {
  const delta = receiptDelta(receipt);

  return (
    <div className="mb-3.5 rounded-md border border-rule bg-paper-raised px-[18px] py-4">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2.5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div>
          <div className="text-[15px] font-semibold">{receipt.store || "Receipt"}</div>
          <div className="font-mono text-xs text-ink-soft">{receipt.date}</div>
        </div>
        <div className="whitespace-nowrap font-mono text-base font-bold text-fern">
          +{formatCurrency(delta)}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 border-t border-dashed border-rule pt-2.5">
          {receipt.items.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-2 py-1 text-[13px]">
              <span>
                {item.name}
                {item.isGlutenFree && (
                  <span className="ml-1.5 rounded-full bg-fern/15 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-fern">
                    GF
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap font-mono text-ink-soft">
                {formatCurrency(item.price)}
                {item.isGlutenFree && ` vs ${formatCurrency(item.regularPrice)}`}
              </span>
            </div>
          ))}
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-[3px] border-[1.5px] border-berry px-2.5 py-1.5 text-xs font-semibold text-berry transition-transform active:translate-y-px"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
