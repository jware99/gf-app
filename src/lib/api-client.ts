import type {
  EquivalentEstimate,
  ExtractedItem,
  Receipt,
  ReceiptItem,
} from "@/types";

/**
 * Client-side HTTP layer. Every component talks to the API through these
 * functions rather than calling fetch() ad hoc, so there is one error
 * shape / one error-handling path for the whole UI (spec §8).
 */
export class ApiClientError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiClientError";
  }
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    const message = body?.error?.message ?? "Something went wrong.";
    throw new ApiClientError(code, message);
  }
  return body as T;
}

export async function fetchReceipts(year?: number): Promise<Receipt[]> {
  const url = year !== undefined ? `/api/receipts?year=${year}` : "/api/receipts";
  const res = await fetch(url);
  const body = await parseJsonOrThrow<{ receipts: Receipt[] }>(res);
  return body.receipts;
}

export async function createReceipt(receipt: {
  store: string;
  date: string;
  items: ReceiptItem[];
}): Promise<Receipt> {
  const res = await fetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(receipt),
  });
  const body = await parseJsonOrThrow<{ receipt: Receipt }>(res);
  return body.receipt;
}

export async function deleteReceipt(id: string): Promise<void> {
  const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
  await parseJsonOrThrow<{ ok: true }>(res);
}

export async function extractReceiptItems(file: File): Promise<ExtractedItem[]> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/receipts/extract", { method: "POST", body: formData });
  const body = await parseJsonOrThrow<{ items: ExtractedItem[] }>(res);
  return body.items;
}

export async function estimateEquivalentPrices(
  items: { name: string; purchasedPrice: number }[],
): Promise<EquivalentEstimate[]> {
  const res = await fetch("/api/receipts/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const body = await parseJsonOrThrow<{ items: EquivalentEstimate[] }>(res);
  return body.items;
}

export async function getAgiForYear(year: number): Promise<number> {
  const res = await fetch(`/api/settings?year=${year}`);
  const body = await parseJsonOrThrow<{ year: number; agi: number }>(res);
  return body.agi;
}

export async function setAgiForYear(year: number, agi: number): Promise<number> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, agi }),
  });
  const body = await parseJsonOrThrow<{ year: number; agi: number }>(res);
  return body.agi;
}
