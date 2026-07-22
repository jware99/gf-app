"use client";

import type { Receipt } from "@/types";
import { ReceiptCard } from "@/components/ledger/ReceiptCard";

interface ReceiptListProps {
  receipts: Receipt[];
  year: number;
  openReceiptId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReceiptList({
  receipts,
  year,
  openReceiptId,
  onToggle,
  onDelete,
}: ReceiptListProps) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-md border-[1.5px] border-dashed border-rule px-5 py-9 text-center text-sm text-ink-soft">
        No receipts logged for {year} yet.
        <br />
        Tap &ldquo;Add receipt&rdquo; to snap your first one.
      </div>
    );
  }

  const sorted = [...receipts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div>
      {sorted.map((receipt) => (
        <ReceiptCard
          key={receipt.id}
          receipt={receipt}
          isOpen={openReceiptId === receipt.id}
          onToggle={() => onToggle(receipt.id)}
          onDelete={() => onDelete(receipt.id)}
        />
      ))}
    </div>
  );
}
