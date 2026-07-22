import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { config } from "@/lib/config";

/**
 * Edge-safe half of the Auth.js config: providers + the `authorized`
 * callback only, no Prisma import. Consumed directly by src/middleware.ts,
 * which runs on the Edge runtime and would crash the build if it pulled in
 * PrismaClient (Node-only). The Node-only pieces (adapter, session
 * strategy, events) live in lib/auth.ts, which spreads this config in.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: config.AUTH_GOOGLE_ID,
      clientSecret: config.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname === "/login") return true;
      return !!auth?.user;
    },
  },
};
