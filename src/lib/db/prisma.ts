import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient, cached on `globalThis` in dev so Next.js's hot
 * reload doesn't open a new connection pool on every edit. This file (and
 * PrismaClient itself) is only ever imported from prisma-receipt-repository.ts.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
