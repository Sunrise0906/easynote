"use client";

import { useState } from "react";
import { Check, Copy, Pencil, Sparkles, X } from "lucide-react";
import Markdown from "../Markdown";
import { Button } from "../../ui";
import { apiPatch, apiPost } from "@/lib/client";
import { NoteData } from "@/lib/types";

export default function NotesTab({
  note,
  activeLanguage,
  onNoteChange,
  onClearTranslation,
  aiReady,
}: {
  note: NoteData;
  activeLanguage: string | null;
  onNoteChange: (n: NoteData) => void;
  onClearTranslation: () => void;
  aiReady: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const translation = activeLanguage
    ? note.translations[activeLanguage]
    : null;
  const summary = translation?.summary ?? note.summary;
  const markdown = translation?.notesMarkdown ?? note.notesMarkdown;

  const copy = async () => {
    const text = [
      `# ${note.emoji} ${note.title}`,
      summary ? `\n> ${summary}\n` : "",
      markdown ?? "",
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setDraft(note.notesMarkdown ?? "");
    setEditing(true);
    if (activeLanguage) onClearTranslation();
  };

  const save = async () => {
    setSaving(true);
    const res = await apiPatch<{ note: NoteData }>(`/api/notes/${note.id}`, {
      notesMarkdown: draft,
    });
    onNoteChange(res.note);
    setSaving(false);
    setEditing(false);
  };

  const generateNotes = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await apiPost<{ note: NoteData }>(
        `/api/notes/${note.id}/generate`,
        { kind: "notes" }
      );
      onNoteChange(res.note);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (!note.notesMarkdown && !editing) {
    return (
      <EmptyState
        aiReady={aiReady}
        generating={generating}
        error={genError}
        onGenerate={generateNotes}
      />
    );
  }

  return (
    <div>
      {activeLanguage && translation && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
          <span>
            Viewing <strong>{activeLanguage}</strong> translation
          </span>
          <button
            onClick={onClearTranslation}
            className="font-semibold underline underline-offset-2"
          >
            Show original
          </button>
        </div>
      )}

      {!editing && summary && (
        <div className="mb-5 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-fuchsia-50/50 p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
            Summary
          </div>
          <p className="mt-1.5 text-[15px] leading-7 text-slate-700">
            {summary}
          </p>
          {!activeLanguage && note.keyPoints && note.keyPoints.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {note.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-end gap-2">
        {!editing ? (
          <>
            <Button variant="ghost" onClick={copy} className="!px-3 !py-1.5">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              onClick={startEdit}
              className="!px-3 !py-1.5"
            >
              <Pencil size={15} /> Edit
            </Button>
            {aiReady && (
              <Button
                variant="ghost"
                onClick={generateNotes}
                loading={generating}
                className="!px-3 !py-1.5"
                title="Regenerate notes from the transcript"
              >
                <Sparkles size={15} /> Regenerate
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => setEditing(false)}
              className="!px-3 !py-1.5"
            >
              <X size={15} /> Cancel
            </Button>
            <Button onClick={save} loading={saving} className="!px-3 !py-1.5">
              <Check size={15} /> Save
            </Button>
          </>
        )}
      </div>
      {genError && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {genError}
        </div>
      )}

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[32rem] w-full resize-y rounded-2xl border border-slate-300 p-5 font-mono text-[13px] leading-6 focus:border-brand-500 focus:outline-none"
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <Markdown>{markdown ?? ""}</Markdown>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  aiReady,
  generating,
  error,
  onGenerate,
}: {
  aiReady: boolean;
  generating: boolean;
  error: string;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Sparkles className="mx-auto text-brand-400" size={36} />
      <div className="mt-3 font-bold text-slate-800">No AI notes yet</div>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {aiReady
          ? "Generate structured notes with an overview, sections and key takeaways from this note's content."
          : "Add ANTHROPIC_API_KEY to .env.local and restart the server to unlock AI note generation."}
      </p>
      {error && (
        <div className="mx-auto mt-4 max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}
      {aiReady && (
        <Button onClick={onGenerate} loading={generating} className="mt-5">
          <Sparkles size={16} /> Generate notes
        </Button>
      )}
    </div>
  );
}
