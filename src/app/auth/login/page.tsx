import { GraduationCap, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { getSessionUser, homeForRole } from "@/lib/session";
import { loginAction } from "../actions";

const demoAccounts = [
  { role: "Student", email: "amina@student.eduflow.test", password: "Student123!" },
  { role: "Lecturer", email: "mateo@lecturer.eduflow.test", password: "Lecturer123!" },
  { role: "Teaching Assistant", email: "leah@ta.eduflow.test", password: "Assistant123!" },
  { role: "Admin", email: "noah@admin.eduflow.test", password: "Admin123!" },
];

const errorMessages: Record<string, string> = {
  invalid: "That email and password combination did not match an account.",
  missing: "Enter both your email and password to continue.",
  unavailable: "We're having trouble reaching the service right now. Please try again in a moment.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const existing = await getSessionUser();
  if (existing) redirect(homeForRole(existing.role));

  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / value side */}
      <aside className="bg-aurora relative hidden flex-col justify-between overflow-hidden border-r border-zinc-200/60 p-12 lg:flex dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
            <GraduationCap size={18} />
          </span>
          <span className="text-lg tracking-tight">EduFlow</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            One platform for courses, grading, and credentials.
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-300">
            Sign in to your role workspace — learning dashboards, the course
            builder, grading queues, and the admin console all run on the same
            real account.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            {[
              "Video courses with progress, quizzes & assignments",
              "Lecturer course builder and TA grading queues",
              "Admin approvals, analytics, and verifiable certificates",
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

      {/* Form side */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to continue to your EduFlow workspace.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form action={loginAction} className="space-y-4">
            {params.next ? (
              <input type="hidden" name="next" value={params.next} />
            ) : null}
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
                  defaultValue="amina@student.eduflow.test"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  defaultValue="Student123!"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
            New to EduFlow?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              <Sparkles size={15} className="text-brand-500" />
              Demo accounts
            </div>
            <div className="space-y-1.5 text-xs">
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 font-mono text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <span className="font-sans font-semibold text-zinc-700 dark:text-zinc-200">
                    {account.role}
                  </span>
                  <span className="truncate">
                    {account.email} · {account.password}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
