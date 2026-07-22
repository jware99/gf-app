import type { AIProvider } from "@/lib/ai/ai-provider";
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import type { ReceiptRepository } from "@/lib/db/receipt-repository";
import { PrismaReceiptRepository } from "@/lib/db/prisma-receipt-repository";

/**
 * Single place that knows about the concrete AnthropicProvider /
 * PrismaReceiptRepository classes. Route handlers and services import
 * these functions (typed to the interfaces), never the concrete classes —
 * swapping providers or databases means editing only this file plus the
 * one new implementation file.
 */
let aiProvider: AIProvider | undefined;
let receiptRepository: ReceiptRepository | undefined;

export function getAIProvider(): AIProvider {
  if (!aiProvider) {
    aiProvider = new AnthropicProvider();
  }
  return aiProvider;
}

export function getReceiptRepository(): ReceiptRepository {
  if (!receiptRepository) {
    receiptRepository = new PrismaReceiptRepository();
  }
  return receiptRepository;
}
