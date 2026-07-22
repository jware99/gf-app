/**
 * One-off smoke test for AnthropicProvider's parsing/mapping logic, run with:
 *   npx tsx --env-file=.env scripts/smoke-ai.ts
 *
 * Mocks the Anthropic SDK response shape (fenced JSON, snake_case fields,
 * exactly as Claude would return per the ported prompts) so this can run
 * without a real ANTHROPIC_API_KEY or network access. It proves the
 * fence-stripping + snake_case -> camelCase mapping works. A true end-to-end
 * check against a real receipt photo requires a real key and happens once
 * /api/receipts/extract exists (Phase 5+).
 */
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";

type FakeMessage = { content: { type: string; text: string }[] };

function fakeTextMessage(text: string): FakeMessage {
  return { content: [{ type: "text", text }] };
}

async function main() {
  const provider = new AnthropicProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (provider as any).client;

  client.messages.create = async () =>
    fakeTextMessage(
      '```json\n[{"name": "GF Sandwich Bread", "price": 6.49, "likely_gluten_free": true}, {"name": "Bananas", "price": 1.2, "likely_gluten_free": false}]\n```',
    );

  const extracted = await provider.extractReceiptItems("fakebase64", "image/jpeg");
  console.log("extractReceiptItems ->", extracted);

  const expectedExtracted = [
    { name: "GF Sandwich Bread", price: 6.49, likelyGlutenFree: true },
    { name: "Bananas", price: 1.2, likelyGlutenFree: false },
  ];
  if (JSON.stringify(extracted) !== JSON.stringify(expectedExtracted)) {
    throw new Error("extractReceiptItems mapping mismatch");
  }

  client.messages.create = async () =>
    fakeTextMessage(
      '[{"name": "GF Sandwich Bread", "estimated_regular_price": 3.29}]',
    );

  const estimated = await provider.estimateEquivalentPrices([
    { name: "GF Sandwich Bread", purchasedPrice: 6.49 },
  ]);
  console.log("estimateEquivalentPrices ->", estimated);

  const expectedEstimated = [
    { name: "GF Sandwich Bread", estimatedRegularPrice: 3.29 },
  ];
  if (JSON.stringify(estimated) !== JSON.stringify(expectedEstimated)) {
    throw new Error("estimateEquivalentPrices mapping mismatch");
  }

  console.log("Smoke test passed: fence-stripping + camelCase mapping OK.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exitCode = 1;
});
