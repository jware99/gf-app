import { z } from "zod";

/**
 * Zod schemas shared by API routes (and, later, forms). Every route
 * validates its body/query against one of these before touching a
 * service — never trust client input, including numbers that look like
 * they came from our own UI.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date string (YYYY-MM-DD).");

export const receiptItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  price: z.number().nonnegative("Price cannot be negative."),
  isGlutenFree: z.boolean(),
  regularPrice: z.number().nonnegative("Regular price cannot be negative."),
});

export const createReceiptSchema = z.object({
  store: z.string().trim().min(1, "Store name is required."),
  date: isoDate,
  items: z
    .array(receiptItemSchema)
    .min(1, "A receipt needs at least one item."),
});

export const listReceiptsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});

export const agiSettingQuerySchema = z.object({
  year: z.coerce.number().int(),
});

export const putAgiSettingSchema = z.object({
  year: z.number().int(),
  agi: z.number().nonnegative("AGI cannot be negative."),
});

export const estimateItemSchema = z.object({
  name: z.string().trim().min(1),
  purchasedPrice: z.number().nonnegative(),
});

export const estimateRequestSchema = z.object({
  items: z.array(estimateItemSchema).min(1, "Provide at least one item to estimate."),
});
