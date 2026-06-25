import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow — Learn. Teach. Grow.",
  description:
<<<<<<< HEAD
    "A role-based learning platform for video courses, quizzes, assignments, discussions, and verifiable certificates.",
=======
    "A role-based learning platform for video courses, quizzes, assignments, discussions, and certificates.",
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
};

// Applies the saved (or system) theme before paint to avoid a flash.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('eduflow-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" className="h-full scroll-smooth dark" suppressHydrationWarning>
      <body className="min-h-full bg-stone-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('eduflow_theme')||'dark';document.documentElement.classList.toggle('dark',t!=='light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.classList.add('dark')}",
          }}
        />
=======
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        {/* Runs before paint to apply the saved/system theme without a flash.
            next/script (beforeInteractive) is the supported way to inject an
            inline pre-hydration script; a raw <script> trips a React warning. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
        {children}
      </body>
    </html>
  );
}
