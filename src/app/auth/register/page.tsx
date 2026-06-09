import { GraduationCap, UserPlus } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { userForRole } from "@/lib/mock-data";

export default function RegisterPage() {
  const student = userForRole("STUDENT");

  return (
    <PageShell user={student}>
      <PageTitle
        eyebrow="Create account"
        title="Register as a learner or apply as a lecturer"
        body="Students can enroll immediately after email verification. Lecturer profiles enter the admin review queue before publishing courses."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-2">
            <UserPlus className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">Student registration</h2>
          </div>
          <form className="mt-4 space-y-4">
            {["Full name", "Email", "Password"].map((label) => (
              <label key={label} className="block text-sm font-medium">
                {label}
                <input
                  className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                  type={label === "Password" ? "password" : "text"}
                />
              </label>
            ))}
            <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
              Send verification email
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-emerald-600" size={20} />
            <h2 className="text-xl font-semibold">Lecturer application</h2>
          </div>
          <form className="mt-4 space-y-4">
            {["Institution", "Professional bio", "Course topic"].map((label) => (
              <label key={label} className="block text-sm font-medium">
                {label}
                <textarea className="mt-2 min-h-20 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
              </label>
            ))}
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
