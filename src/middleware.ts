import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Uses the edge-safe authConfig (no Prisma) so this can run on the Edge
 * runtime. The `authorized` callback in authConfig decides per-request;
 * returning false redirects to `pages.signIn` ("/login").
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icons/).*)",
  ],
};
