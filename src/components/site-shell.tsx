import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { roleLabel } from "@/lib/eduflow";
import type { Role, User } from "@/lib/types";
import { ButtonLink, cn } from "./ui";

const roleLinks: { href: string; role: Role; icon: ReactNode }[] = [
  { href: "/dashboard", role: "STUDENT", icon: <LayoutDashboard size={16} /> },
  { href: "/lecturer", role: "LECTURER", icon: <GraduationCap size={16} /> },
  { href: "/ta", role: "TA", icon: <UsersRound size={16} /> },
  { href: "/admin", role: "ADMIN", icon: <ShieldCheck size={16} /> },
];

export function SiteHeader({ user }: { user?: User }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-stone-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <BookOpen size={18} aria-hidden="true" />
            </span>
            <span className="text-lg tracking-normal">EduFlow</span>
          </Link>
          <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {user ? roleLabel(user.role) : "Demo LMS"}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Main">
          <ButtonLink href="/courses" variant="ghost">
            <BookOpen size={16} />
            Courses
          </ButtonLink>
          {roleLinks.map((item) => (
            <ButtonLink key={item.role} href={item.href} variant="ghost">
              {item.icon}
              {roleLabel(item.role)}
            </ButtonLink>
          ))}
          <ButtonLink href="/auth/login" variant="secondary">
            <UserCog size={16} />
            Demo login
          </ButtonLink>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Dark mode follows your system preference"
            type="button"
          >
            <Moon size={16} />
          </button>
        </nav>
      </div>
    </header>
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
    <div className="min-h-screen dark:bg-zinc-950 dark:text-zinc-50">
      <SiteHeader user={user} />
      <main className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
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
          <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-cyan-700 dark:text-cyan-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950 dark:text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          {body}
        </p>
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
