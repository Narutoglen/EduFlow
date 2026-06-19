import { MailCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { ButtonLink, Panel } from "@/components/ui";
import { userForRole } from "@/lib/mock-data";

export default function ResetPage() {
  const student = userForRole("STUDENT");

  return (
    <PageShell user={student}>
      <PageTitle
        eyebrow="Password reset"
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
              defaultValue="amina@student.eduflow.test"
            />
          </label>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
            Email reset link
          </button>
        </form>
        <div className="mt-4">
          <ButtonLink href="/auth/login" variant="secondary">
            Back to login
          </ButtonLink>
        </div>
      </Panel>
    </PageShell>
  );
}
