import { Building2, CalendarDays, CheckCircle2, Link2, Mail, ShieldCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel } from "@/components/ui";
import { roleLabel } from "@/lib/eduflow";
import { prisma } from "@/lib/prisma";
import { homeForRole, requireUser } from "@/lib/session";

export default async function ProfilePage() {
  // Any signed-in user can view their own profile; redirects to login otherwise.
  const user = await requireUser("/profile");

  // The session user covers most fields; fetch createdAt for "member since".
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { createdAt: true },
  });

  return (
    <PageShell user={user}>
      <PageTitle
        eyebrow="Your account"
        title="Profile"
        body="The details associated with your EduFlow account."
        action={
          <ButtonLink href={homeForRole(user.role)} variant="secondary">
            Back to dashboard
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Identity card */}
        <Panel className="h-fit">
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
            />
            <h2 className="mt-4 text-xl font-semibold text-zinc-950 dark:text-white">
              {user.name}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="brand">{roleLabel(user.role)}</Badge>
              {user.isActive ? (
                <Badge tone="green">
                  <CheckCircle2 size={13} />
                  Active
                </Badge>
              ) : (
                <Badge tone="red">Disabled</Badge>
              )}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              <Mail size={14} className="text-zinc-400" />
              {user.email}
            </p>
          </div>
        </Panel>

        {/* Details */}
        <div className="space-y-6">
          <Panel>
            <h3 className="text-lg font-semibold">Account details</h3>
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <ShieldCheck size={14} />
                  Role
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-white">
                  {roleLabel(user.role)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <Building2 size={14} />
                  Institution
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-white">
                  {user.institution || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <Mail size={14} />
                  Email
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-white">{user.email}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <CalendarDays size={14} />
                  Member since
                </dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-white">
                  {account?.createdAt
                    ? account.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold">About</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {user.bio || "You haven't added a bio yet."}
            </p>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold">Links</h3>
            </div>
            {user.socialLinks.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                No links added.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {user.socialLinks.map((link) => (
                  <li key={link}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
