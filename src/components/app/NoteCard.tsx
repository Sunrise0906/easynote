"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CircleAlert,
  FolderInput,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button, Field, Modal, inputClass } from "../ui";
import { apiDelete, apiPatch } from "@/lib/client";
import { FolderData, NoteSummaryData, SOURCE_LABEL } from "@/lib/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NoteCard({
  note,
  folders,
  onChanged,
}: {
  note: NoteSummaryData;
  folders: FolderData[];
  onChanged: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [busy, setBusy] = useState(false);

  const processing = note.status !== "ready" && note.status !== "error";

  const rename = async () => {
    setBusy(true);
    await apiPatch(`/api/notes/${note.id}`, { title });
    setBusy(false);
    setRenameOpen(false);
    onChanged();
  };

  const move = async (folderId: string | null) => {
    setBusy(true);
    await apiPatch(`/api/notes/${note.id}`, { folderId });
    setBusy(false);
    setMoveOpen(false);
    onChanged();
  };

  const remove = async () => {
    setBusy(true);
    await apiDelete(`/api/notes/${note.id}`);
    setBusy(false);
    setDeleteOpen(false);
    onChanged();
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-md">
      <Link href={`/notes/${note.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="text-2xl">{note.emoji}</div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {SOURCE_LABEL[note.sourceType]}
          </span>
        </div>
        <div className="mt-2.5 line-clamp-2 font-bold leading-snug text-slate-900">
          {note.title}
        </div>

        {processing ? (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-600">
              <Loader2 size={13} className="animate-spin" />
              {note.statusMessage || "Processing…"}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${note.progress}%` }}
              />
            </div>
          </div>
        ) : note.status === "error" ? (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-rose-600">
            <CircleAlert size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{note.error}</span>
          </div>
        ) : (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {note.summary || "Transcript ready."}
          </p>
        )}

        <div className="mt-3 text-[11px] text-slate-400">
          {timeAgo(note.updatedAt)}
        </div>
      </Link>

      {/* menu */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 group-hover:text-slate-400"
          aria-label="Note menu"
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute bottom-9 right-0 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <MenuItem
                icon={<Pencil size={14} />}
                label="Rename"
                onClick={() => {
                  setMenuOpen(false);
                  setTitle(note.title);
                  setRenameOpen(true);
                }}
              />
              <MenuItem
                icon={<FolderInput size={14} />}
                label="Move to folder"
                onClick={() => {
                  setMenuOpen(false);
                  setMoveOpen(true);
                }}
              />
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename note"
      >
        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) rename();
            }}
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRenameOpen(false)}>
            Cancel
          </Button>
          <Button onClick={rename} loading={busy} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title="Move to folder"
      >
        <div className="space-y-1.5">
          <button
            onClick={() => move(null)}
            className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition hover:border-brand-400 ${!note.folderId ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700"}`}
          >
            🗂️ All notes (no folder)
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => move(f.id)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition hover:border-brand-400 ${note.folderId === f.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700"}`}
            >
              📁 {f.name}
            </button>
          ))}
          {folders.length === 0 && (
            <p className="text-sm text-slate-500">
              No folders yet — create one from the sidebar.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete note?"
      >
        <p className="text-sm text-slate-600">
          “{note.title}” and its transcript, flashcards, quiz and chat history
          will be permanently deleted.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition hover:bg-slate-50 ${danger ? "text-rose-600" : "text-slate-700"}`}
    >
      {icon}
      {label}
    </button>
  );
}
