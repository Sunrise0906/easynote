import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "@/lib/config";

// generateMetadata (not a static export) so metadataBase resolves APP_URL at
// request time — a static build in the Docker builder would freeze localhost.
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(appUrl()),
    title: {
      default: "EasyNote — AI Note-Taking Assistant",
      template: "%s · EasyNote",
    },
    description:
      "EasyNote turns lectures, meetings, YouTube videos, PDFs and images into structured notes, summaries, flashcards, quizzes, mind maps and an AI chat tutor.",
    icons: {
      icon: "/favicon.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
