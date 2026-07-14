"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the real error in the browser console for debugging
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-5 py-20">
      <div className="glass-panel w-full max-w-md rounded-lg p-7 text-center shadow-soft">
        <h1 className="font-heading text-2xl font-semibold text-heading">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          The admin panel hit an unexpected error. Your session is still active — try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-[#b7963f]"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
