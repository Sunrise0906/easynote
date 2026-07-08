import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Sidebar from "@/components/app/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
