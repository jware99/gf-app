/**
 * Ensures lib/config.ts's eager env validation doesn't throw during tests
 * (route files transitively import it), without depending on how/whether
 * the test runner loads .env. Only sets values that aren't already set, so
 * a real .env is still respected if present.
 */
process.env.ANTHROPIC_API_KEY ??= "sk-ant-test-placeholder";
process.env.ANTHROPIC_MODEL ??= "claude-sonnet-5";
process.env.DATABASE_URL ??= "file:./test.db";
process.env.AUTH_SECRET ??= "test-secret-not-for-production";
process.env.AUTH_GOOGLE_ID ??= "test-google-client-id";
process.env.AUTH_GOOGLE_SECRET ??= "test-google-client-secret";
