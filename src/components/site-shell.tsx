import { GraduationCap, LayoutDashboard, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { homeForRole } from "@/lib/session";
import { roleLabel } from "@/lib/eduflow";
import type { User } from "@/lib/types";
import { cn } from "./ui";
import { HeaderActions } from "./header-actions";

export function SiteHeader({ user }: { user?: User }) {
  const dashboardHref = user ? homeForRole(user.role) : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-background/80 backdrop-blur-xl dark:border-zinc-800/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm shadow-brand-600/30">
              <GraduationCap size={18} aria-hidden="true" />
            </span>
            <span className="text-lg tracking-tight">EduFlow</span>
          </Link>
          <nav
            className="hidden items-center gap-1 text-sm md:flex"
            aria-label="Main"
          >
            <NavLink href="/courses">Courses</NavLink>
            {user ? (
              <NavLink href={dashboardHref}>
                <LayoutDashboard size={15} />
                Dashboard
              </NavLink>
            ) : null}
            {user?.role === "STUDENT" ? (
              <NavLink href="/achievements">
                <Trophy size={15} />
                Achievements
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <span className="hidden rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 lg:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {roleLabel(user.role)}
            </span>
          ) : null}
          <HeaderActions
            user={
              user
                ? {
                    name: user.name,
                    email: user.email,
                    roleLabel: roleLabel(user.role),
                    avatarUrl: user.avatarUrl,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

export function PageShell({
  children,
  user,
  className,
}: {
  children: ReactNode;
  user?: User;
  className?: string;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />
      <main
        className={cn(
          "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          {body}
        </p>
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
