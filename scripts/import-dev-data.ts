/**
 * One-off import counterpart to scripts/export-dev-data.ts, run manually
 * against whichever database DATABASE_URL currently points at:
 *   npx tsx --env-file=.env scripts/import-dev-data.ts
 *
 * Re-inserts every receipt/year-setting from dev-data-export.json as
 * unclaimed (userId: null) rows. Whoever signs in first in that
 * environment claims them via events.createUser in src/lib/auth.ts —
 * same behavior as before the Postgres migration, just replayed on a new
 * database. Safe to run twice by accident only in the sense that it will
 * just duplicate rows, not error — check counts before/after if unsure.
 *
 * Not part of the app's runtime code path.
 */
import { readFileSync } from "fs";
import { prisma } from "@/lib/db/prisma";

interface DumpItem {
  name: string;
  price: number;
  isGlutenFree: boolean;
  regularPrice: number;
}

interface DumpReceipt {
  store: string;
  date: string;
  createdAt: string;
  items: DumpItem[];
}

interface DumpYearSetting {
  year: number;
  agi: number;
}

interface Dump {
  exportedAt: string;
  receipts: DumpReceipt[];
  yearSettings: DumpYearSetting[];
}

async function main() {
  const dump: Dump = JSON.parse(readFileSync("dev-data-export.json", "utf-8"));

  for (const receipt of dump.receipts) {
    await prisma.receipt.create({
      data: {
        store: receipt.store,
        date: new Date(receipt.date),
        createdAt: new Date(receipt.createdAt),
        userId: null,
        items: {
          create: receipt.items.map((item) => ({
            name: item.name,
            price: item.price,
            isGlutenFree: item.isGlutenFree,
            regularPrice: item.regularPrice,
          })),
        },
      },
    });
  }

  for (const setting of dump.yearSettings) {
    await prisma.yearSetting.create({
      data: { year: setting.year, agi: setting.agi, userId: null },
    });
  }

  console.log(
    `Imported ${dump.receipts.length} receipt(s) and ${dump.yearSettings.length} year setting(s) as unclaimed rows.`,
  );
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
