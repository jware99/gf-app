"use client";

interface ProgressBarProps {
  pct: number;
  over: boolean;
}

export function ProgressBar({ pct, over }: ProgressBarProps) {
  return (
    <div
      className="my-3.5 h-2.5 overflow-hidden rounded-md border border-rule bg-paper"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full transition-[width] duration-[400ms] ease-in-out ${
          over ? "bg-fern" : "bg-wheat"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
