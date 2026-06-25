"use client";

// App-level error boundary. In production Next.js hands this a sanitized error
// (generic message + a `digest` for server log correlation) — never the raw
// stack/query — so a failure like a database outage shows a friendly screen
// instead of leaking internals (OWASP A09/A10). In development the overlay still
// appears on top; this is what real users see in production.
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          We couldn&apos;t complete that request
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          The service may be temporarily unavailable. Please try again — if it
          keeps happening, come back in a few minutes.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
