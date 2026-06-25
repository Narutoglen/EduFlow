"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "eduflow_cookie_consent";
const YEAR = 60 * 60 * 24 * 365;

function setConsent(value: "accepted" | "essential") {
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${YEAR}; Path=/; SameSite=Lax`;
  localStorage.setItem(COOKIE_NAME, value);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const hasLocalConsent = localStorage.getItem(COOKIE_NAME);
      const hasCookieConsent = document.cookie
        .split("; ")
        .some((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
      setVisible(!hasLocalConsent && !hasCookieConsent);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-zinc-950 dark:text-white">Choose your cookie preference</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            EduFlow uses essential cookies for secure sign-in. With your
            permission, we may also remember preferences such as theme and
            notification choices on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
            type="button"
            onClick={() => {
              setConsent("essential");
              setVisible(false);
            }}
          >
            Essential only
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            type="button"
            onClick={() => {
              setConsent("accepted");
              setVisible(false);
            }}
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
