import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Pilot — Celebration & Event Planner",
  description: "Inclusive, editorial event-planning studio inspired by the warmth and order of an almanac.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-bg text-neutral-text antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
