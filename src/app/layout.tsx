import type { Metadata } from "next";
import { Space_Grotesk, Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { appUrl } from "@/lib/config";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(appUrl()),
    title: {
      default: "Recall — remember what you learn",
      template: "%s · Recall",
    },
    description:
      "Recall turns lectures, meetings, videos, PDFs and images into structured notes, flashcards, quizzes, mind maps and a chat tutor — so you actually remember them.",
    icons: { icon: "/favicon.svg" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
