"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import CreateHub from "./CreateHub";
import NoteCard from "./NoteCard";
import { apiGet } from "@/lib/client";
import { FolderData, NoteSummaryData } from "@/lib/types";

export default function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const folderId = params.get("folder");
  const [notes, setNotes] = useState<NoteSummaryData[] | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [n, f] = await Promise.all([
        apiGet<{ notes: NoteSummaryData[] }>("/api/notes"),
        apiGet<{ folders: FolderData[] }>("/api/folders"),
      ]);
      setNotes(n.notes);
      setFolders(f.folders);
      setLoadError("");
      return n.notes;
    } catch (e) {
      // Only surface an error if we have nothing to show yet; a transient
      // polling failure shouldn't blank an already-loaded dashboard.
      setNotes((cur) => {
        if (cur === null) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load your notes."
          );
        }
        return cur;
      });
      return [];
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while any note is still processing.
  useEffect(() => {
    if (!notes) return;
    const processing = notes.some(
      (n) => n.status !== "ready" && n.status !== "error"
    );
    if (processing && !pollRef.current) {
      pollRef.current = setInterval(load, 2500);
    }
    if (!processing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [notes, load]);

  const currentFolder = folders.find((f) => f.id === folderId);
  const visible = (notes ?? []).filter((n) => {
    if (folderId && n.folderId !== folderId) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.summary ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {currentFolder ? `📁 ${currentFolder.name}` : "My notes"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {currentFolder
              ? "Notes in this folder"
              : "Create a note from any source below"}
          </p>
        </div>
        {currentFolder && (
          <button
            onClick={() => router.push("/notes")}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ← All notes
          </button>
        )}
      </div>

      {!currentFolder && <CreateHub onCreated={load} />}

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-slate-900">
          {currentFolder ? "Notes" : "Recent notes"}
          {notes && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              {visible.length}
            </span>
          )}
        </h2>
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      {notes === null && loadError ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <div className="text-3xl">😕</div>
          <div className="mt-3 font-semibold text-rose-800">{loadError}</div>
          <button
            onClick={() => load()}
            className="mt-4 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      ) : notes === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="text-4xl">🗒️</div>
          <div className="mt-3 font-semibold text-slate-700">
            {query ? "No notes match your search" : "No notes yet"}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {query
              ? "Try a different keyword."
              : "Add a YouTube link, upload a file, or start recording — your notes will appear here."}
          </p>
          {folderId && !query && (
            <p className="mt-2 text-sm text-slate-500">
              Move notes here from a note&apos;s{" "}
              <span className="font-medium">⋯ menu → Move to folder</span>, or{" "}
              <Link href="/notes" className="text-brand-600 underline">
                create one from All notes
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => (
            <NoteCard key={n.id} note={n} folders={folders} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
