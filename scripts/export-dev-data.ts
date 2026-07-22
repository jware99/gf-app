/**
 * One-off export, run manually with:
 *   npx tsx --env-file=.env scripts/export-dev-data.ts
 *
 * Dumps every Receipt/ReceiptItem/YearSetting row from the current
 * (SQLite) database to dev-data-export.json, ignoring whatever userId
 * they currently have. The import counterpart (scripts/import-dev-data.ts)
 * re-inserts them as unclaimed (userId: null) rows, so the existing
 * claimOrphanedReceipts flow in src/lib/auth.ts naturally re-assigns them
 * to whichever account signs in first in each new (Postgres) environment
 * — the same behavior as today, just replayed on a new database.
 *
 * Not part of the app's runtime code path. Deleted after the Postgres
 * migration is complete; the output file is gitignored (personal data).
 */
import { writeFileSync } from "fs";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const receipts = await prisma.receipt.findMany({ include: { items: true } });
  const yearSettings = await prisma.yearSetting.findMany();

  const dump = {
    exportedAt: new Date().toISOString(),
    receipts: receipts.map((r) => ({
      store: r.store,
      date: r.date.toISOString(),
      createdAt: r.createdAt.toISOString(),
      items: r.items.map((item) => ({
        name: item.name,
        price: item.price,
        isGlutenFree: item.isGlutenFree,
        regularPrice: item.regularPrice,
      })),
    })),
    yearSettings: yearSettings.map((y) => ({ year: y.year, agi: y.agi })),
  };

  writeFileSync("dev-data-export.json", JSON.stringify(dump, null, 2));
  console.log(
    `Exported ${dump.receipts.length} receipt(s) and ${dump.yearSettings.length} year setting(s) to dev-data-export.json`,
  );
}

main()
  .catch((err) => {
    console.error("Export failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
