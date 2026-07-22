"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <div className="w-full max-w-sm rounded border-2 border-ink bg-paper-raised p-8 shadow-[0_2px_0_#14261c]">
        <h1 className="font-mono text-2xl font-bold tracking-tight">
          Crumb <span className="text-fern">Trail</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in to photograph gluten-free grocery receipts and track the
          extra cost toward your celiac medical-expense deduction.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[3px] border-2 border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_2px_0_#1b3a2b] transition-transform active:translate-y-px"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
