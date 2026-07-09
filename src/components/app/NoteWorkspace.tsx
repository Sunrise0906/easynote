"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  Check,
  ChevronDown,
  Copy,
  Download,
  FolderInput,
  Languages,
  Link2,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  MoreHorizontal,
  Network,
  Pencil,
  Presentation,
  ScrollText,
  Share2,
  Trash2,
} from "lucide-react";
import MediaPlayer from "./MediaPlayer";
import ProcessSteps from "./ProcessSteps";
import NotesTab from "./tabs/NotesTab";
import TranscriptTab from "./tabs/TranscriptTab";
import FlashcardsTab from "./tabs/FlashcardsTab";
import QuizTab from "./tabs/QuizTab";
import ChatTab from "./tabs/ChatTab";
import MindmapTab from "./tabs/MindmapTab";
import FeynmanTab from "./tabs/FeynmanTab";
import { Button, Field, Modal, inputClass } from "../ui";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { FolderData, MeResponse, NoteData, SOURCE_LABEL } from "@/lib/types";

type TabKey =
  | "notes"
  | "transcript"
  | "flashcards"
  | "quiz"
  | "feynman"
  | "chat"
  | "mindmap";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "notes", label: "Notes", icon: BookOpenText },
  { key: "transcript", label: "Transcript", icon: ScrollText },
  { key: "flashcards", label: "Flashcards", icon: Brain },
  { key: "quiz", label: "Quiz", icon: ListChecks },
  { key: "feynman", label: "Teach-back", icon: Presentation },
  { key: "chat", label: "Chat", icon: MessageCircleQuestion },
  { key: "mindmap", label: "Mind map", icon: Network },
];

export default function NoteWorkspace({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [note, setNote] = useState<NoteData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<TabKey>("notes");
  const [aiReady, setAiReady] = useState(true);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const seekRef = useRef<((t: number) => void) | null>(null);

  // toolbar state
  const [langMenu, setLangMenu] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const [exportMenu, setExportMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [toolbarError, setToolbarError] = useState("");
  const [audioWarn, setAudioWarn] = useState(false);

  // Recorder redirects here with ?audio=failed when the audio couldn't be
  // attached — the transcript note is fine, but playback isn't available.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audio") === "failed"
    ) {
      setAudioWarn(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ note: NoteData }>(`/api/notes/${noteId}`);
      setNote(res.note);
      setLoadError("");
      return res.note;
    } catch (e) {
      // Only fail hard on the INITIAL load. A transient failure during
      // polling (network blip, redeploy) must not replace an already-loaded,
      // still-processing workspace with the error page.
      setNote((cur) => {
        if (!cur) {
          setLoadError(e instanceof Error ? e.message : "Could not load note.");
        }
        return cur;
      });
      return null;
    }
  }, [noteId]);

  useEffect(() => {
    load();
    apiGet<MeResponse>("/api/auth/me")
      .then((d) => setAiReady(Boolean(d.capabilities?.ai)))
      .catch(() => {});
    apiGet<{ folders: FolderData[] }>("/api/folders")
      .then((d) => setFolders(d.folders))
      .catch(() => {});
  }, [load]);

  // Poll while processing.
  useEffect(() => {
    if (!note) return;
    if (note.status === "ready" || note.status === "error") return;
    const t = setInterval(async () => {
      const fresh = await load();
      if (fresh && (fresh.status === "ready" || fresh.status === "error")) {
        clearInterval(t);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [note, load]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="text-4xl">🤔</div>
        <div className="mt-3 font-display font-bold text-ink">{loadError}</div>
        <Link
          href="/notes"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          ← Back to my notes
        </Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const processing = note.status !== "ready" && note.status !== "error";

  const retry = async () => {
    setRetrying(true);
    setToolbarError("");
    try {
      await apiPost(`/api/notes/${note.id}/retry`);
      await load();
    } catch (e) {
      setToolbarError(e instanceof Error ? e.message : "Could not retry.");
    } finally {
      setRetrying(false);
    }
  };

  const translate = async (language: string) => {
    setLangMenu(false);
    setToolbarError("");
    if (note.translations[language]) {
      setActiveLanguage(language);
      setTab("notes");
      return;
    }
    setTranslating(language);
    try {
      const res = await apiPost<{ translation: unknown }>(
        `/api/notes/${note.id}/translate`,
        { language }
      );
      void res;
      const fresh = await load();
      if (fresh) {
        setActiveLanguage(language);
        setTab("notes");
      }
    } catch (e) {
      setToolbarError(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setTranslating(null);
    }
  };

  const toggleShare = async (enabled: boolean) => {
    setShareBusy(true);
    setToolbarError("");
    try {
      const res = await apiPost<{ shareToken: string | null }>(
        `/api/notes/${note.id}/share`,
        { enabled }
      );
      setNote({ ...note, shareToken: res.shareToken });
    } catch (e) {
      setToolbarError(
        e instanceof Error ? e.message : "Could not update sharing."
      );
    } finally {
      setShareBusy(false);
    }
  };

  const copyShare = async () => {
    if (!note.shareToken) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/share/${note.shareToken}`
    );
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 1500);
  };

  const rename = async () => {
    setBusy(true);
    setToolbarError("");
    try {
      const res = await apiPatch<{ note: NoteData }>(`/api/notes/${note.id}`, {
        title,
      });
      setNote(res.note);
      setRenameOpen(false);
    } catch (e) {
      setToolbarError(e instanceof Error ? e.message : "Could not rename.");
    } finally {
      setBusy(false);
    }
  };

  const move = async (folderId: string | null) => {
    setBusy(true);
    setToolbarError("");
    try {
      const res = await apiPatch<{ note: NoteData }>(`/api/notes/${note.id}`, {
        folderId,
      });
      setNote(res.note);
      setMoveOpen(false);
    } catch (e) {
      setToolbarError(e instanceof Error ? e.message : "Could not move note.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setToolbarError("");
    try {
      await apiDelete(`/api/notes/${note.id}`);
      router.push("/notes");
    } catch (e) {
      setToolbarError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  const hasMedia =
    Boolean(note.youtubeId) ||
    (Boolean(note.mediaFile) && note.sourceType !== "pdf");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} /> My notes
        </Link>

        {!processing && (
          <div className="relative flex items-center gap-1.5">
            {/* translate */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setLangMenu(!langMenu)}
                className="!px-3 !py-2"
                loading={Boolean(translating)}
                title="Translate notes"
              >
                <Languages size={16} />
                <span className="hidden sm:inline">
                  {activeLanguage ?? "Translate"}
                </span>
                <ChevronDown size={13} />
              </Button>
              {langMenu && (
                <MenuPanel onClose={() => setLangMenu(false)}>
                  {activeLanguage && (
                    <MenuBtn
                      label="Show original"
                      onClick={() => {
                        setActiveLanguage(null);
                        setLangMenu(false);
                      }}
                    />
                  )}
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <MenuBtn
                      key={l}
                      label={
                        note.translations[l] ? `${l} ✓` : l
                      }
                      onClick={() => translate(l)}
                    />
                  ))}
                </MenuPanel>
              )}
            </div>

            {/* share */}
            <Button
              variant="ghost"
              onClick={() => setShareOpen(true)}
              className="!px-3 !py-2"
              title="Share"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* export */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setExportMenu(!exportMenu)}
                className="!px-3 !py-2"
                title="Export"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={13} />
              </Button>
              {exportMenu && (
                <MenuPanel onClose={() => setExportMenu(false)}>
                  <MenuBtn
                    label="Notes (.md)"
                    onClick={() => {
                      window.open(`/api/notes/${note.id}/export?format=md`);
                      setExportMenu(false);
                    }}
                  />
                  <MenuBtn
                    label="Notes (.txt)"
                    onClick={() => {
                      window.open(`/api/notes/${note.id}/export?format=txt`);
                      setExportMenu(false);
                    }}
                  />
                  <MenuBtn
                    label="Transcript (.txt)"
                    onClick={() => {
                      window.open(
                        `/api/notes/${note.id}/export?format=transcript`
                      );
                      setExportMenu(false);
                    }}
                  />
                  <MenuBtn
                    label="Everything (.json)"
                    onClick={() => {
                      window.open(`/api/notes/${note.id}/export?format=json`);
                      setExportMenu(false);
                    }}
                  />
                </MenuPanel>
              )}
            </div>

            {/* more */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setMoreMenu(!moreMenu)}
                className="!px-2.5 !py-2"
                title="More"
              >
                <MoreHorizontal size={17} />
              </Button>
              {moreMenu && (
                <MenuPanel onClose={() => setMoreMenu(false)}>
                  <MenuBtn
                    icon={<Pencil size={14} />}
                    label="Rename"
                    onClick={() => {
                      setMoreMenu(false);
                      setTitle(note.title);
                      setRenameOpen(true);
                    }}
                  />
                  <MenuBtn
                    icon={<FolderInput size={14} />}
                    label="Move to folder"
                    onClick={() => {
                      setMoreMenu(false);
                      setMoveOpen(true);
                    }}
                  />
                  <MenuBtn
                    icon={<Trash2 size={14} />}
                    label="Delete note"
                    danger
                    onClick={() => {
                      setMoreMenu(false);
                      setDeleteOpen(true);
                    }}
                  />
                </MenuPanel>
              )}
            </div>
          </div>
        )}
      </div>

      {toolbarError && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
          {toolbarError}
        </div>
      )}

      {audioWarn && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-ink">
          <span>
            Your transcript was saved, but the audio couldn&apos;t be attached
            — playback won&apos;t be available for this recording.
          </span>
          <button
            onClick={() => setAudioWarn(false)}
            className="shrink-0 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {processing || note.status === "error" ? (
        <ProcessSteps note={note} onRetry={retry} retrying={retrying} />
      ) : (
        <>
          {/* title */}
          <div className="mt-5 flex items-start gap-3">
            <div className="text-3xl leading-tight">{note.emoji}</div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-ink">
                {note.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-bold uppercase tracking-wide text-muted">
                  {SOURCE_LABEL[note.sourceType]}
                </span>
                {note.language && <span>lang: {note.language}</span>}
                <span>
                  {new Date(note.createdAt).toLocaleDateString()} ·{" "}
                  {note.transcript.length} segments
                </span>
                {note.sourceUrl && (
                  <a
                    href={note.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Link2 size={12} /> source
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* media */}
          {hasMedia && (
            <div className="mt-5">
              <MediaPlayer note={note} seekRef={seekRef} />
            </div>
          )}

          {/* tabs */}
          <div className="thin-scroll mt-6 flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="py-6">
            {tab === "notes" && (
              <NotesTab
                note={note}
                activeLanguage={activeLanguage}
                onNoteChange={setNote}
                onClearTranslation={() => setActiveLanguage(null)}
                aiReady={aiReady}
              />
            )}
            {tab === "transcript" && (
              <TranscriptTab note={note} seekRef={seekRef} />
            )}
            {tab === "flashcards" && (
              <FlashcardsTab
                note={note}
                onNoteChange={setNote}
                aiReady={aiReady}
              />
            )}
            {tab === "quiz" && (
              <QuizTab note={note} onNoteChange={setNote} aiReady={aiReady} />
            )}
            {tab === "feynman" && (
              <FeynmanTab note={note} aiReady={aiReady} />
            )}
            {tab === "chat" && (
              <ChatTab
                note={note}
                aiReady={aiReady}
                onNoteChange={setNote}
              />
            )}
            {tab === "mindmap" && <MindmapTab note={note} />}
          </div>
        </>
      )}

      {/* share modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this note"
      >
        <p className="text-sm text-muted">
          Anyone with the link can view a read-only version of the notes and
          transcript.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3.5">
          <span className="text-sm font-semibold text-ink">
            Public link
          </span>
          <button
            onClick={() => toggleShare(!note.shareToken)}
            disabled={shareBusy}
            className={`relative h-6 w-11 rounded-full transition ${note.shareToken ? "bg-primary" : "bg-surface-2"}`}
            aria-label="Toggle sharing"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-[var(--shadow-soft)] transition-all ${note.shareToken ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>
        {note.shareToken && (
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              className={`${inputClass} !py-2 font-mono !text-xs`}
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}/share/${note.shareToken}`
                  : `/share/${note.shareToken}`
              }
            />
            <Button variant="secondary" onClick={copyShare} className="shrink-0 !px-3">
              {copiedShare ? <Check size={15} /> : <Copy size={15} />}
            </Button>
          </div>
        )}
      </Modal>

      {/* rename modal */}
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

      {/* move modal */}
      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title="Move to folder"
      >
        <div className="space-y-1.5">
          <button
            onClick={() => move(null)}
            className={`w-full rounded-md border px-4 py-2.5 text-left text-sm font-medium transition hover:border-primary ${!note.folderId ? "border-primary bg-primary/10 text-primary" : "border-border text-ink"}`}
          >
            🗂️ All notes (no folder)
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => move(f.id)}
              className={`w-full rounded-md border px-4 py-2.5 text-left text-sm font-medium transition hover:border-primary ${note.folderId === f.id ? "border-primary bg-primary/10 text-primary" : "border-border text-ink"}`}
            >
              📁 {f.name}
            </button>
          ))}
          {folders.length === 0 && (
            <p className="text-sm text-muted">
              No folders yet — create one from the sidebar.
            </p>
          )}
        </div>
      </Modal>

      {/* delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete note?"
      >
        <p className="text-sm text-muted">
          “{note.title}” and all its study materials will be permanently
          deleted.
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

function MenuPanel({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="thin-scroll absolute right-0 top-10 z-20 max-h-80 w-52 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-soft)]">
        {children}
      </div>
    </>
  );
}

function MenuBtn({
  label,
  onClick,
  icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium transition hover:bg-surface-2 ${danger ? "text-red-600" : "text-ink"}`}
    >
      {icon}
      {label}
    </button>
  );
}
