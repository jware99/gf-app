/**
 * One-off smoke test for PrismaReceiptRepository, run manually with:
 *   npx tsx --env-file=.env scripts/smoke-db.ts
 *
 * Proves the repository round-trips against the local SQLite dev DB before
 * any API routes exist. Not part of the app's runtime code path.
 */
import { PrismaReceiptRepository } from "@/lib/db/prisma-receipt-repository";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const repo = new PrismaReceiptRepository();

  console.log("Creating a receipt...");
  const created = await repo.create({
    store: "Smoke Test Grocer",
    date: "2026-03-15",
    items: [
      { name: "GF Sandwich Bread", price: 6.49, isGlutenFree: true, regularPrice: 3.29 },
      { name: "Bananas", price: 1.2, isGlutenFree: false, regularPrice: 0 },
    ],
  });
  console.log("Created:", created);

  console.log("Setting AGI for 2026...");
  await repo.setAgiForYear(2026, 60000);
  const agi = await repo.getAgiForYear(2026);
  console.log("AGI for 2026:", agi);

  console.log("Listing receipts for 2026...");
  const listed = await repo.list(2026);
  console.log("Listed:", listed);

  if (listed.length !== 1 || listed[0].id !== created.id) {
    throw new Error("Smoke test failed: created receipt not found in list().");
  }

  console.log("Deleting receipt...");
  await repo.delete(created.id);
  const afterDelete = await repo.list(2026);

  if (afterDelete.length !== 0) {
    throw new Error("Smoke test failed: receipt still present after delete().");
  }

  console.log("Smoke test passed: create/list/delete round-trip OK.");
}

main()
  .catch((err) => {
    console.error("Smoke test failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
