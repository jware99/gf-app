import type { AIProvider } from "@/lib/ai/ai-provider";
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import type { ReceiptRepository } from "@/lib/db/receipt-repository";
import { PrismaReceiptRepository } from "@/lib/db/prisma-receipt-repository";
import { ReceiptService } from "@/lib/services/receipt-service";

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

let receiptService: ReceiptService | undefined;

export function getReceiptService(): ReceiptService {
  if (!receiptService) {
    receiptService = new ReceiptService(getAIProvider(), getReceiptRepository());
  }
  return receiptService;
}

/**
 * Test-only override hooks, so route-handler integration tests can inject
 * a mocked AIProvider and an in-memory ReceiptRepository test double
 * instead of hitting the real Anthropic API / Prisma database (spec §9).
 * Not used by any production code path.
 */
export function __setTestOverrides(overrides: {
  aiProvider?: AIProvider;
  receiptRepository?: ReceiptRepository;
}): void {
  if (overrides.aiProvider) aiProvider = overrides.aiProvider;
  if (overrides.receiptRepository) receiptRepository = overrides.receiptRepository;
  receiptService = undefined;
}

export function __resetContainerForTesting(): void {
  aiProvider = undefined;
  receiptRepository = undefined;
  receiptService = undefined;
}
