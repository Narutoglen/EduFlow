import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow — Learn. Teach. Grow.",
  description:
    "A role-based learning platform for video courses, quizzes, assignments, discussions, and verifiable certificates.",
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
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        {/* Runs before paint to apply the saved/system theme without a flash.
            next/script (beforeInteractive) is the supported way to inject an
            inline pre-hydration script; a raw <script> trips a React warning. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
