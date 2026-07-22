"use client";

import type { DraftItem } from "@/types";

interface ReviewTableProps {
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
}

export function ReviewTable({ items, onChange }: ReviewTableProps) {
  function updateItem(id: string, patch: Partial<DraftItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="mb-2 grid gap-1.5 rounded-[5px] border border-rule bg-white p-2.5"
        >
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`item-name-${item.id}`}>
              Item name
            </label>
            <input
              id={`item-name-${item.id}`}
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              className="flex-1 rounded border border-rule px-2 py-1.5 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-fern"
            />
            <label className="sr-only" htmlFor={`item-price-${item.id}`}>
              Price
            </label>
            <input
              id={`item-price-${item.id}`}
              type="number"
              step="0.01"
              placeholder="Price"
              value={item.price}
              onChange={(e) => updateItem(item.id, { price: e.target.value })}
              className="w-[90px] rounded border border-rule px-2 py-1.5 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-fern"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove item ${idx + 1}`}
              className="border-none bg-transparent text-sm text-berry"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              id={`item-gf-${item.id}`}
              type="checkbox"
              checked={item.isGlutenFree}
              onChange={(e) => updateItem(item.id, { isGlutenFree: e.target.checked })}
              className="h-[15px] w-[15px]"
            />
            <label htmlFor={`item-gf-${item.id}`}>Gluten-free product</label>
          </div>

          {item.isGlutenFree && (
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              <label htmlFor={`item-regular-price-${item.id}`}>
                Regular equivalent price
              </label>
              <input
                id={`item-regular-price-${item.id}`}
                type="number"
                step="0.01"
                value={item.regularPrice}
                onChange={(e) => updateItem(item.id, { regularPrice: e.target.value })}
                className="w-20 rounded border border-rule px-2 py-1 focus:outline-2 focus:outline-offset-1 focus:outline-fern"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
