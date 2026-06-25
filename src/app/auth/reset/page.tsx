import { CheckCircle2, MailCheck } from "lucide-react";
import Link from "next/link";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export default async function ResetPage() {
  const user = await getCurrentUser();

  return (
    <PageShell user={user ?? undefined}>
      <PageTitle
        eyebrow="Password reset"
<<<<<<< HEAD
        title="Reset your password"
        body="Enter your account email and we'll send a secure reset link if a matching account exists."
      />
      <Panel className="mx-auto max-w-xl">
        {sent ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>
              If an account exists for that address, a reset link is on its way.
              Email delivery isn&apos;t enabled in this demo — use the seeded
              demo credentials on the{" "}
              <Link href="/auth/login" className="font-semibold underline">
                sign-in page
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MailCheck className="text-brand-600" size={20} />
              <h2 className="text-lg font-semibold">Send a reset link</h2>
            </div>
            <form action={requestResetAction} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Email address
                <input
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-brand-950"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <Button type="submit">Email reset link</Button>
            </form>
          </>
        )}
        <div className="mt-5">
=======
        title="Send a reset link"
        body="Enter your account email and EduFlow will send instructions for setting a new password."
      />
      <Panel className="mx-auto max-w-xl">
        <div className="flex items-center gap-2">
          <MailCheck className="text-cyan-700" size={20} />
          <h2 className="text-xl font-semibold">Reset password</h2>
        </div>
        <form action="/api/auth/session" method="post" className="mt-4 space-y-4">
          <input type="hidden" name="intent" value="reset" />
          <label className="block text-sm font-medium">
            Email address
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              name="email"
              type="email"
              autoComplete="email"
            />
          </label>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
            Email reset link
          </button>
        </form>
        <div className="mt-4">
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
          <ButtonLink href="/auth/login" variant="secondary">
            Back to sign in
          </ButtonLink>
        </div>
      </Panel>
    </PageShell>
  );
}
