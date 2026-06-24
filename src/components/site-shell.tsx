<<<<<<< HEAD
import { GraduationCap, LayoutDashboard, Trophy } from "lucide-react";
=======
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Moon,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
import Link from "next/link";
import type { ReactNode } from "react";
import { homeForRole } from "@/lib/session";
import { roleLabel } from "@/lib/eduflow";
<<<<<<< HEAD
import type { User } from "@/lib/types";
import { cn } from "./ui";
import { HeaderActions } from "./header-actions";

export function SiteHeader({ user }: { user?: User }) {
  const dashboardHref = user ? homeForRole(user.role) : "/dashboard";

=======
import type { Role, User } from "@/lib/types";
import { ButtonLink, cn } from "./ui";

const roleHome: Record<Role, { href: string; label: string; icon: ReactNode }> = {
  STUDENT: {
    href: "/dashboard",
    label: "My learning",
    icon: <LayoutDashboard size={16} />,
  },
  LECTURER: {
    href: "/lecturer",
    label: "Lecturer workspace",
    icon: <GraduationCap size={16} />,
  },
  TA: {
    href: "/ta",
    label: "Support queue",
    icon: <UsersRound size={16} />,
  },
  ADMIN: {
    href: "/admin",
    label: "Admin console",
    icon: <ShieldCheck size={16} />,
  },
};

function SiteHeader({ user }: { user?: User }) {
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
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
<<<<<<< HEAD
          <nav
            className="hidden items-center gap-1 text-sm md:flex"
            aria-label="Main"
=======
          <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {user ? roleLabel(user.role) : "Learning platform"}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Main">
          <ButtonLink href="/courses" variant="ghost">
            <BookOpen size={16} />
            Courses
          </ButtonLink>
          {user ? (
            <ButtonLink href={roleHome[user.role].href} variant="ghost">
              {roleHome[user.role].icon}
              {roleHome[user.role].label}
            </ButtonLink>
          ) : null}
          <ButtonLink href="/auth/login" variant="secondary">
            <LogIn size={16} />
            Sign in
          </ButtonLink>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Dark mode follows your system preference"
            type="button"
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
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
