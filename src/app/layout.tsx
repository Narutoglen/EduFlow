import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow | Course Platform",
  description:
    "A role-based LMS MVP for video courses, quizzes, assignments, discussions, and certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-stone-50 text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}
