import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { getReceiptRepository } from "@/lib/container";
import { authConfig } from "@/lib/auth.config";

/**
 * Full, Node-only Auth.js config. Only ever imported from
 * src/app/api/auth/[...nextauth]/route.ts and server-side code that calls
 * `auth()` — never from src/middleware.ts (see auth.config.ts).
 *
 * Session strategy is JWT even though a database adapter is configured:
 * the adapter persists User/Account rows (so Google identities become
 * real, queryable users), but session lookups stay in the signed cookie so
 * middleware never needs a database round-trip.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    // Fires exactly once, the moment a brand-new User row is created —
    // never on subsequent sign-ins. Whoever signs in first claims every
    // pre-auth receipt/AGI row (userId IS NULL) as their own; every user
    // after that finds nothing left to claim.
    async createUser({ user }) {
      if (!user.id) return;
      const userCount = await prisma.user.count();
      if (userCount === 1) {
        await getReceiptRepository().claimOrphanedReceipts(user.id);
      }
    },
  },
});
