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

export default async function RegisterPage({
  searchParams,
}: {
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
          </form>

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
  );
}
