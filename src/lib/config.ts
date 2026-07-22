import { z } from "zod";

/**
 * Twelve-Factor config: every secret / environment-specific value is read
 * from process.env exactly once, here, and validated eagerly so a missing
 * or malformed value fails loudly at startup instead of surfacing as a
 * confusing runtime error deep in a request handler.
 *
 * Import this module only from server-side code (src/app/api/** or
 * src/lib/**). Never import it from a Client Component.
 */
const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string({ message: "ANTHROPIC_API_KEY is required (server-side Anthropic API key)." })
    .min(1, "ANTHROPIC_API_KEY is required (server-side Anthropic API key)."),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is required (Prisma connection string)." })
    .min(1, "DATABASE_URL is required (Prisma connection string)."),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables. Copy .env.example to .env and fill in real values.\n${issues}`,
    );
  }
  return parsed.data;
}

export const config = loadConfig();
