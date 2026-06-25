"use client";

import { CircleUser, LogOut, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { logoutAction } from "@/app/auth/actions";
import { cn } from "./ui";

type HeaderUser = {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string;
};

function subscribeToTheme(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function ThemeToggle() {
  // Read the theme from the DOM (the source of truth, set by an inline script
  // before hydration) without storing duplicate state in an effect. The
  // observer re-renders this button whenever the `dark` class changes.
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("eduflow-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle theme"
      className="grid h-10 w-10 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function UserMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1 pl-1 pr-2.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatarUrl}
          alt=""
          className="h-7 w-7 rounded-lg object-cover"
        />
        <span className="hidden max-w-28 truncate sm:block">
          {user.name.split(" ")[0]}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              {user.roleLabel}
            </span>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 border-b border-zinc-100 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <CircleUser size={16} />
            View profile
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderActions({
  user,
}: {
  user?: HeaderUser;
}) {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {user ? (
        <UserMenu user={user} />
      ) : (
        <>
          <Link
            href="/auth/login"
            className={cn(
              "hidden min-h-10 items-center rounded-xl px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
            )}
          >
            <UserRound size={16} className="mr-2" />
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex min-h-10 items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            Get started
          </Link>
        </>
      )}
    </div>
  );
}
