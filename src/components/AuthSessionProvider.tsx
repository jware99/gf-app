"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Thin client wrapper so the (server) root layout can hand every client
 * component the session via next-auth/react's useSession() hook, without
 * making the whole layout a client component.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
