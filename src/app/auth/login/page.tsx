import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const notice = valueOf(params.notice);
  const user = await getCurrentUser();

  return (
    <PageShell user={user ?? undefined}>
      <PageTitle
        eyebrow="Authentication"
        title="Sign in to EduFlow"
        body="Access your learning dashboard, teaching workspace, support queue, or admin console."
      />

      {notice ? (
        <Panel className="mx-auto mb-6 max-w-5xl border-emerald-200 bg-emerald-50 text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <p className="font-semibold">
              {notice === "reset-sent"
                ? "Password reset instructions are ready to send."
                : notice === "invalid"
                  ? "That email and password did not match an active account."
                  : notice === "use-email"
                    ? "Use your registered email and password for local review."
                    : notice === "registered"
                      ? "Your account has been created."
                : "You are signed in."}
            </p>
          </div>
        </Panel>
      ) : null}

      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <form action="/api/auth/session" method="post" className="space-y-4">
            <input type="hidden" name="intent" value="login" />
            <label className="block text-sm font-medium">
              Email
              <span className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <Mail size={16} className="text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full bg-transparent outline-none"
                />
              </span>
            </label>
            <label className="block text-sm font-medium">
              Password
              <span className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <KeyRound size={16} className="text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full bg-transparent outline-none"
                />
              </span>
            </label>
            <button className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              Continue with email
            </button>
          </form>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/api/auth/session?provider=google" variant="secondary">
              Google SSO
            </ButtonLink>
            <ButtonLink href="/auth/reset" variant="secondary">
              Reset password
            </ButtonLink>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h2 className="text-xl font-semibold">New to EduFlow?</h2>
          </div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
            Create an account to enroll in courses, receive notifications, and
            track your progress. The first registered user on a fresh
            installation becomes the platform administrator.
          </p>
          <div className="mt-5">
            <ButtonLink href="/auth/register" variant="secondary">
              Create an account
            </ButtonLink>
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
