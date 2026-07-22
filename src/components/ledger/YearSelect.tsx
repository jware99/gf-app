"use client";

interface YearSelectProps {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
}

export function YearSelect({ years, selectedYear, onChange }: YearSelectProps) {
  return (
    <label>
      <span className="sr-only">Select year</span>
      <select
        className="rounded-[2px] border-[1.5px] border-ink bg-paper-raised px-2.5 py-2 font-mono text-sm text-ink"
        value={selectedYear}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
