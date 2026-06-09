import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { userForRole } from "@/lib/mock-data";

export default function LoginPage() {
  const student = userForRole("STUDENT");

  return (
    <PageShell user={student}>
      <PageTitle
        eyebrow="Authentication"
        title="Sign in to EduFlow"
        body="The MVP uses demo sessions and keeps Auth.js, Google OAuth, JWT refresh tokens, and email verification behind explicit service boundaries."
      />

      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <form action="/api/auth/demo" method="post" className="space-y-4">
            <label className="block text-sm font-medium">
              Email
              <span className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <Mail size={16} className="text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  defaultValue="amina@student.eduflow.test"
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
                  defaultValue="password"
                  className="w-full bg-transparent outline-none"
                />
              </span>
            </label>
            <button className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              Continue with email
            </button>
          </form>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/api/auth/demo?provider=google" variant="secondary">
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
            <h2 className="text-xl font-semibold">Demo accounts</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Student", "/dashboard"],
              ["Lecturer", "/lecturer"],
              ["Teaching Assistant", "/ta"],
              ["Admin", "/admin"],
            ].map(([label, href]) => (
              <ButtonLink key={label} href={href} variant="secondary">
                {label}
              </ButtonLink>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
            Registration, verification, Google OAuth, and refresh-token sessions
            are modeled for integration without requiring credentials in local
            review.
          </p>
        </Panel>
      </section>
    </PageShell>
  );
}
