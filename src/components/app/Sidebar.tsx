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
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Folders
          </span>
          <button
            onClick={() => setNewFolderOpen(true)}
            className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-primary"
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>
        <div className="mt-1.5 space-y-0.5">
          {folders.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-muted">
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
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-muted hover:text-red-500 group-hover:block"
                title="Delete folder"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        {aiReady === false && (
          <Link
            href="/settings"
            className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs leading-5 text-ink"
          >
            <CircleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              <strong>AI is off.</strong> Add ANTHROPIC_API_KEY to enable
              notes, flashcards & chat.
            </span>
          </Link>
        )}

        {quota && me?.user?.plan === "free" && (
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="flex justify-between text-xs font-medium text-muted">
              <span>Notes this month</span>
              <span>
                {quota.notesUsed}/{quota.notesLimit}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, (quota.notesUsed / quota.notesLimit) * 100)}%`,
                }}
              />
            </div>
            <Link
              href="/price"
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-ink"
            >
              <Crown size={13} /> Upgrade to Pro
            </Link>
          </div>
        )}

        {me?.user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {me.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">
                {me.user.name}
              </div>
              <div className="truncate text-[11px] text-muted">
                {me.user.plan === "pro" ? "Pro plan" : "Starter plan"}
                {me.user.guest ? " · guest" : ""}
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
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
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Logo href="/notes" size={26} />
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface shadow-[var(--shadow-soft)]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {nav}
          </div>
        </div>
      )}
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface md:block">
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
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
