import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import type {
  AIProvider,
  EquivalentEstimate,
  ExtractedItem,
} from "@/lib/ai/ai-provider";

const SUPPORTED_IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
type SupportedImageMediaType = (typeof SUPPORTED_IMAGE_MEDIA_TYPES)[number];

function assertSupportedImageMediaType(
  mediaType: string,
): SupportedImageMediaType {
  if (
    (SUPPORTED_IMAGE_MEDIA_TYPES as readonly string[]).includes(mediaType)
  ) {
    return mediaType as SupportedImageMediaType;
  }
  throw new Error(`Unsupported image media type: ${mediaType}`);
}

/** Strips ```json / ``` fences some models wrap JSON responses in, defensively. */
function stripCodeFences(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}

function firstTextBlock(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "[]";
}

interface RawExtractedItem {
  name?: unknown;
  price?: unknown;
  likely_gluten_free?: unknown;
}

interface RawEquivalentEstimate {
  name?: unknown;
  estimated_regular_price?: unknown;
}

/**
 * Concrete AIProvider implementation calling the Anthropic API. Only
 * imported from Route Handlers under src/app/api/**; never from
 * src/components/**. ANTHROPIC_API_KEY is read once via lib/config.ts.
 */
export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    this.model = config.ANTHROPIC_MODEL;
  }

  async extractReceiptItems(
    imageBase64: string,
    mediaType: string,
  ): Promise<ExtractedItem[]> {
    const supportedMediaType = assertSupportedImageMediaType(mediaType);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: supportedMediaType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: 'Extract every purchased line item from this grocery receipt with its price. For each, judge whether it is a gluten-free-labeled product (e.g. says "gluten free" / "GF" on the label, or is a naturally gluten-free specialty substitute like almond flour, GF bread, GF pasta). Respond with ONLY a JSON array, no markdown fences, no commentary, in exactly this format: [{"name": string, "price": number, "likely_gluten_free": boolean}]. If you cannot read it, return [].',
              },
            ],
          },
        ],
      });

      const raw = firstTextBlock(message);
      const parsed = JSON.parse(stripCodeFences(raw)) as unknown;
      if (!Array.isArray(parsed)) return [];

      return (parsed as RawExtractedItem[])
        .filter((item) => typeof item.name === "string")
        .map((item) => ({
          name: item.name as string,
          price: typeof item.price === "number" ? item.price : 0,
          likelyGlutenFree: Boolean(item.likely_gluten_free),
        }));
    } catch {
      return [];
    }
  }

  async estimateEquivalentPrices(
    items: { name: string; purchasedPrice: number }[],
  ): Promise<EquivalentEstimate[]> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `For each gluten-free grocery product below, estimate the typical price of the standard gluten-containing equivalent product at an average US grocery store. Respond with ONLY a JSON array, no markdown fences, no commentary, in exactly this format: [{"name": string, "estimated_regular_price": number}]. Items: ${JSON.stringify(
              items.map((i) => ({
                name: i.name,
                purchased_price: i.purchasedPrice,
              })),
            )}`,
          },
        ],
      });

      const raw = firstTextBlock(message);
      const parsed = JSON.parse(stripCodeFences(raw)) as unknown;
      if (!Array.isArray(parsed)) return [];

      return (parsed as RawEquivalentEstimate[])
        .filter((item) => typeof item.name === "string")
        .map((item) => ({
          name: item.name as string,
          estimatedRegularPrice:
            typeof item.estimated_regular_price === "number"
              ? item.estimated_regular_price
              : 0,
        }));
    } catch {
      return [];
    }
  }
}
