<<<<<<< HEAD
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
=======
import { GraduationCap, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { getSessionUser, homeForRole } from "@/lib/session";
import { registerAction } from "../actions";

const errorMessages: Record<string, string> = {
  invalid: "Enter your name, a valid email, and a password of at least 8 characters.",
  exists: "An account with that email already exists. Try signing in instead.",
  unavailable: "We're having trouble reaching the service right now. Please try again in a moment.",
};
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

export default async function RegisterPage({
  searchParams,
}: {
<<<<<<< HEAD
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
=======
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const existing = await getSessionUser();
  if (existing) redirect(homeForRole(existing.role));

  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="bg-aurora relative hidden flex-col justify-between overflow-hidden border-r border-zinc-200/60 p-12 lg:flex dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
            <GraduationCap size={18} />
          </span>
          <span className="text-lg tracking-tight">EduFlow</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Start learning in minutes.
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-300">
            Create a free learner account to enroll in courses, track your
            progress, take quizzes, submit assignments, and earn verifiable
            certificates.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            {[
              "Browse and enroll across the full course catalog",
              "Pick up exactly where you left off, on any device",
              "Lecturer & admin roles are provisioned by your workspace owner",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          © {new Date().getFullYear()} EduFlow. Built for modern learning teams.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              Free for learners. No credit card required.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form action={registerAction} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Full name
              <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-brand-950">
                <UserRound size={16} className="text-zinc-400" />
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Email
              <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-brand-950">
                <Mail size={16} className="text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Password
              <span className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-brand-950">
                <KeyRound size={16} className="text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>
            <Button type="submit" className="w-full">
              Create account
            </Button>
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
          </form>

<<<<<<< HEAD
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
=======
          <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
  );
}
