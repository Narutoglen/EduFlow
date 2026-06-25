import { GraduationCap, UserPlus } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function noticeText(notice?: string) {
  return {
    invalid: "Check your name, email, and password. Passwords must match and be at least 8 characters.",
    "email-exists": "An account already exists for that email address.",
    "lecturer-application": "Your lecturer application has been sent to the admin team.",
  }[notice ?? ""];
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const notice = valueOf(params.notice);
  const user = await getCurrentUser();
  const message = noticeText(notice);

  return (
    <PageShell user={user ?? undefined}>
      <PageTitle
        eyebrow="Create account"
        title="Register as a learner or apply as a lecturer"
        body="Learners can create accounts, choose email notifications, and enroll immediately. Lecturer profiles enter the admin review queue before publishing courses."
      />

      {message ? (
        <Panel className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
          <p className="font-semibold">{message}</p>
        </Panel>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-2">
            <UserPlus className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">Create your account</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            The first active account created on a fresh installation becomes
            the platform admin. After that, public registration creates learner
            accounts only.
          </p>
          <form action="/api/auth/register" method="post" className="mt-4 space-y-4">
            <input type="hidden" name="intent" value="student" />
            <label className="block text-sm font-medium">
              Full name
              <input
                name="name"
                required
                autoComplete="name"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm font-medium">
              Institution or school
              <input
                name="institution"
                autoComplete="organization"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm font-medium">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input name="emailNotifications" type="checkbox" defaultChecked />
              Send me email notifications for registration, due dates, and submission confirmations.
            </label>
            <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              Create account
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-emerald-600" size={20} />
            <h2 className="text-xl font-semibold">Lecturer application</h2>
          </div>
          <form action="/api/auth/register" method="post" className="mt-4 space-y-4">
            <input type="hidden" name="intent" value="lecturer-application" />
            <label className="block text-sm font-medium">
              Full name
              <input name="name" className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input name="email" type="email" className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Institution
              <textarea name="institution" className="mt-2 min-h-20 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Course topic
              <textarea name="courseTopic" className="mt-2 min-h-20 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              Submit for admin review
            </button>
          </form>
        </Panel>
      </section>

      <div className="mt-6">
        <ButtonLink href="/auth/login" variant="secondary">
          Back to login
        </ButtonLink>
      </div>
    </PageShell>
  );
}
