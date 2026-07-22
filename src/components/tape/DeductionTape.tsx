"use client";

import { deductibleAmount, floorAmount } from "@/lib/services/deduction-calculator";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "@/components/tape/ProgressBar";
import styles from "@/components/tape/tape.module.css";

interface DeductionTapeProps {
  agi: number;
  onAgiChange: (agi: number) => void;
  total: number;
}

export function DeductionTape({ agi, onAgiChange, total }: DeductionTapeProps) {
  const floor = floorAmount(agi);
  const deductible = deductibleAmount(total, floor);
  const pct = floor > 0 ? Math.min(100, (total / floor) * 100) : 0;
  const over = agi > 0 && total >= floor;

  let note: string;
  if (!agi) {
    note = "Enter your AGI to see how close you are to the floor.";
  } else if (over) {
    note = `Past the floor — ${formatCurrency(deductible)} is deductible so far this year (combine with other medical expenses).`;
  } else {
    note = `${formatCurrency(floor - total)} more in extra GF cost before anything is deductible.`;
  }

  return (
    <div
      className={`${styles.tape} rounded border border-rule bg-paper-raised px-[22px] pb-[26px] pt-[22px]`}
    >
      <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[2px] text-ink-soft">
        Deduction tracker
      </div>

      <div className="mb-3.5 flex items-center justify-between gap-2 text-[13px]">
        <label htmlFor="ct-agi-input">Household AGI</label>
        <input
          id="ct-agi-input"
          type="number"
          min={0}
          step={100}
          placeholder="e.g. 60000"
          value={agi || ""}
          onChange={(e) => onAgiChange(Number(e.target.value) || 0)}
          className="w-[110px] rounded-[3px] border-[1.5px] border-rule bg-white px-2 py-1.5 text-right font-mono focus:outline-2 focus:outline-offset-1 focus:outline-fern"
        />
      </div>

      <div className="flex justify-between border-b border-dotted border-rule py-1.5 font-mono text-[13px]">
        <span>7.5% floor</span>
        <span>{formatCurrency(floor)}</span>
      </div>
      <div className="flex justify-between border-b border-dotted border-rule py-1.5 font-mono text-[13px]">
        <span>Extra GF cost YTD</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <ProgressBar pct={pct} over={over} />
      <div className="mb-3.5 text-[11px] text-ink-soft">{note}</div>

      <div className="mt-1.5 flex justify-between border-t-2 border-ink pt-2.5 font-mono text-[15px] font-bold text-fern">
        <span>Est. deductible</span>
        <span>{formatCurrency(deductible)}</span>
      </div>

      <div className="mt-4 border-t border-dashed border-rule pt-3 text-[11px] leading-relaxed text-ink-soft">
        Estimates only, based on typical grocery prices — not a substitute for
        your own receipts or a tax professional. You must itemize on Schedule
        A for this to apply, and only the amount above the 7.5% AGI floor
        (combined with other medical expenses) is deductible.
      </div>
    </div>
  );
}
