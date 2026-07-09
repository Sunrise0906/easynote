import type { Metadata } from "next";
import MemoryDashboard from "@/components/app/MemoryDashboard";

export const metadata: Metadata = { title: "Memory" };

export default function MemoryPage() {
  return <MemoryDashboard />;
}
