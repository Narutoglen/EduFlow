import { Check, DollarSign, Settings, ShieldAlert, UserCog, X } from "lucide-react";
import Image from "next/image";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar, StatCard } from "@/components/ui";
import {
  formatMoney,
  getCoursesByStatus,
  platformStats,
  roleLabel,
} from "@/lib/eduflow";
import { categories, courses, enrollments, userForRole, users } from "@/lib/mock-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const notice = valueOf(params.notice);
  const admin = userForRole("ADMIN");
  const stats = platformStats();
  const pending = getCoursesByStatus("PENDING_REVIEW");

  return (
    <PageShell user={admin}>
      <PageTitle
        eyebrow="Admin console"
        title="Operate EduFlow quality, access, revenue, and safety"
        body="Approve courses, manage roles, monitor platform analytics, feature categories, and configure global service settings."
      />

      {notice ? (
        <Panel
          className={
            notice === "revisions-requested"
              ? "mb-6 border-amber-200 bg-amber-50 text-amber-950"
              : "mb-6 border-emerald-200 bg-emerald-50 text-emerald-950"
          }
        >
          <div className="flex items-center gap-2">
            {notice === "revisions-requested" ? <X size={18} /> : <Check size={18} />}
            <p className="font-semibold">
              {notice === "revisions-requested"
                ? "Revision request prepared for the lecturer."
                : "Course approved for publishing."}
            </p>
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active users" value={`${users.length}`} detail="Registered accounts" />
        <StatCard label="Active courses" value={`${stats.publishedCourses}`} detail="Published catalog" />
        <StatCard label="Revenue" value={formatMoney(stats.monthlyRevenue)} detail="Monthly course sales" />
        <StatCard label="Pending" value={`${stats.pendingApprovals}`} detail="Course approvals" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Course approval queue</h2>
            </div>
            <div className="space-y-4">
              {pending.map((course) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {course.description}
                      </p>
                    </div>
                    <Badge tone="amber">{course.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={`/courses/${course.slug}`} variant="secondary">
                      Preview
                    </ButtonLink>
                    <a
                      href={`/admin?notice=approved&courseId=${course.id}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white"
                    >
                      <Check size={16} />
                      Approve
                    </a>
                    <a
                      href={`/admin?notice=revisions-requested&courseId=${course.id}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-900"
                    >
                      <X size={16} />
                      Request revisions
                    </a>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-3">
                    <li className="rounded-md bg-stone-50 p-3 dark:bg-zinc-950">
                      Outcomes reviewed
                    </li>
                    <li className="rounded-md bg-stone-50 p-3 dark:bg-zinc-950">
                      Assessment plan checked
                    </li>
                    <li className="rounded-md bg-stone-50 p-3 dark:bg-zinc-950">
                      Certificate eligibility verified
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <UserCog className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">User management</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Image
                            src={user.avatarUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleLabel(user.role)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={user.isActive ? "green" : "red"}>
                          {user.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Revenue and payouts</h2>
            </div>
            <div className="mt-4 space-y-4">
              {courses.filter((course) => course.priceCents > 0).map((course) => (
                <div key={course.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{course.title}</span>
                    <span>{formatMoney(course.priceCents)}</span>
                  </div>
                  <ProgressBar
                    value={
                      enrollments.some((enrollment) => enrollment.courseId === course.id)
                        ? 72
                        : 18
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Featured categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className={`${category.color} rounded-md px-2 py-1 text-xs font-semibold`}>
                  {category.name}
                </span>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Settings className="text-zinc-600" size={20} />
              <h2 className="text-xl font-semibold">Global settings</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                "Payments: secure checkout",
                "Sign-in: email and Google",
                "Email: learner notifications",
                "Storage: course media and submissions",
              ].map((item) => (
                <div key={item} className="rounded-lg bg-stone-50 p-3 dark:bg-zinc-950">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
