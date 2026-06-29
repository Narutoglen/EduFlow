import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow | Course Platform",
  description:
    "A role-based learning platform for video courses, quizzes, assignments, discussions, and certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth dark" suppressHydrationWarning>
      <body className="min-h-full bg-stone-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('eduflow_theme')||'dark';document.documentElement.classList.toggle('dark',t!=='light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.classList.add('dark')}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
