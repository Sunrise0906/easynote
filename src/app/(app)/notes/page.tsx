import { Suspense } from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/app/Dashboard";

export const metadata: Metadata = { title: "My notes" };

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
