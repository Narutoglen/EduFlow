import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

export function cn(...values: Parameters<typeof clsx>) {
  return clsx(values);
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "violet";
}) {
  const tones = {
    neutral: "border-zinc-200 bg-white text-zinc-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-cyan-200 bg-cyan-50 text-cyan-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950",
    secondary:
      "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white",
    ghost: "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        variants[variant],
      )}
    >
      {children}
    </Link>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Panel>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{detail}</p>
    </Panel>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-emerald-500"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
    </div>
  );
}
