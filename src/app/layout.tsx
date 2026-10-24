import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Eczar, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const eczar = Eczar({
  subsets: ["latin"],
  variable: "--font-eczar",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Event Pilot — Celebration & Event Planner",
  description:
    "Plan celebrations with organized budgets, timelines, vendors, guests, seating, and thoughtful AI-powered suggestions.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${eczar.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-FOUC critical styling: guarantees almanac cream palette and prevents raw unstyled flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #FDFBF7 !important;
                color: #1C1917 !important;
                margin: 0;
                padding: 0;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-neutral-bg text-neutral-text antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
