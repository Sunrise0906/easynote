"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CircleAlert,
  Crown,
  FolderPlus,
  Folder as FolderIcon,
  LayoutGrid,
  LogOut,
  Menu,
  Mic,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Logo } from "../Logo";
import { Button, Field, Modal, inputClass } from "../ui";
import { apiDelete, apiGet, apiPost } from "@/lib/client";
import { FolderData, MeResponse } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderBusy, setFolderBusy] = useState(false);

  const refresh = useCallback(() => {
    apiGet<MeResponse>("/api/auth/me").then(setMe).catch(() => {});
    apiGet<{ folders: FolderData[] }>("/api/folders")
      .then((d) => setFolders(d.folders))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("easynote:refresh-sidebar", handler);
    return () =>
      window.removeEventListener("easynote:refresh-sidebar", handler);
  }, [refresh]);

  const createFolder = async () => {
    if (!folderName.trim()) return;
    setFolderBusy(true);
    try {
      await apiPost("/api/folders", { name: folderName.trim() });
      setFolderName("");
      setNewFolderOpen(false);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not create folder");
    } finally {
      setFolderBusy(false);
    }
  };

  const removeFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder “${name}”? Notes inside move to All notes.`))
      return;
    try {
      await apiDelete(`/api/folders/${id}`);
      refresh();
      router.push("/notes");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete folder.");
    }
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      /* clear client state regardless */
    }
    router.push("/home");
    router.refresh();
  };

  const quota = me?.quota;
  const aiReady = me?.capabilities?.ai;

  const nav = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <Logo href="/notes" />
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3 thin-scroll">
        <SidebarLink
          href="/notes"
          active={pathname === "/notes"}
          icon={<LayoutGrid size={17} />}
          label="All notes"
        />
        <SidebarLink
          href="/recording"
          active={pathname === "/recording"}
          icon={<Mic size={17} />}
          label="Record"
        />
        <SidebarLink
          href="/settings"
          active={pathname === "/settings"}
          icon={<Settings size={17} />}
          label="Settings"
        />

        <div className="mt-6 flex items-center justify-between px-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Folders
          </span>
          <button
            onClick={() => setNewFolderOpen(true)}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>
        <div className="mt-1.5 space-y-0.5">
          {folders.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-slate-400">
              No folders yet
            </div>
          )}
          {folders.map((f) => (
            <div key={f.id} className="group relative">
              <SidebarLink
                href={`/notes?folder=${f.id}`}
                active={false}
                icon={<FolderIcon size={16} />}
                label={f.name}
              />
              <button
                onClick={() => removeFolder(f.id, f.name)}
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-slate-300 hover:text-rose-500 group-hover:block"
                title="Delete folder"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </nav>

      <div className="space-y-3 border-t border-slate-100 p-4">
        {aiReady === false && (
          <Link
            href="/settings"
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
          >
            <CircleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              <strong>AI is off.</strong> Add ANTHROPIC_API_KEY to enable
              notes, flashcards & chat.
            </span>
          </Link>
        )}

        {quota && me?.user?.plan === "free" && (
          <div className="rounded-xl bg-slate-100 p-3">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Notes this month</span>
              <span>
                {quota.notesUsed}/{quota.notesLimit}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: `${Math.min(100, (quota.notesUsed / quota.notesLimit) * 100)}%`,
                }}
              />
            </div>
            <Link
              href="/price"
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              <Crown size={13} /> Upgrade to Pro
            </Link>
          </div>
        )}

        {me?.user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {me.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800">
                {me.user.name}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {me.user.plan === "pro" ? "Pro plan" : "Starter plan"}
                {me.user.guest ? " · guest" : ""}
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Logo href="/notes" size={26} />
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-600"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {nav}
          </div>
        </div>
      )}
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        {nav}
      </aside>
      {/* spacer for mobile top bar */}
      <div className="h-14 md:hidden" />

      <Modal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title="New folder"
      >
        <Field label="Folder name">
          <input
            className={inputClass}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. Biology 101"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") createFolder();
            }}
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setNewFolderOpen(false)}>
            Cancel
          </Button>
          <Button onClick={createFolder} loading={folderBusy}>
            Create
          </Button>
        </div>
      </Modal>
    </>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
