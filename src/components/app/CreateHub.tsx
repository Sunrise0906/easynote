"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AudioLines,
  FileText,
  Image as ImageIcon,
  Mic,
  NotebookPen,
  CirclePlay,
} from "lucide-react";
import { Button, ErrorText, Field, Modal, inputClass } from "../ui";
import { ApiError, apiPost } from "@/lib/client";

type ModalKind = "youtube" | "text" | null;

export default function CreateHub({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKind>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileAccept = useRef("");

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.code === "quota_exceeded") {
      setError(e.message + " ");
    } else {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  };

  const createYoutube = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await apiPost<{ note: { id: string } }>("/api/notes", {
        kind: "youtube",
        url,
      });
      onCreated();
      router.push(`/notes/${res.note.id}`);
    } catch (e) {
      fail(e);
    }
  };

  const createText = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await apiPost<{ note: { id: string } }>("/api/notes", {
        kind: "text",
        title,
        text,
      });
      onCreated();
      router.push(`/notes/${res.note.id}`);
    } catch (e) {
      fail(e);
    }
  };

  const pickFile = (accept: string) => {
    fileAccept.current = accept;
    setError("");
    if (fileInput.current) {
      fileInput.current.accept = accept;
      fileInput.current.value = "";
      fileInput.current.click();
    }
  };

  const uploadFile = (file: File) => {
    setUploadPct(0);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadPct(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploadPct(null);
      try {
        const body = JSON.parse(xhr.responseText) as {
          note?: { id: string };
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.note) {
          onCreated();
          router.push(`/notes/${body.note.id}`);
        } else {
          setError(body.error || `Upload failed (${xhr.status}).`);
        }
      } catch {
        setError("Upload failed.");
      }
    };
    xhr.onerror = () => {
      setUploadPct(null);
      setError("Upload failed — check your connection.");
    };
    xhr.send(form);
  };

  const tiles: {
    icon: React.ElementType;
    title: string;
    desc: string;
    color: string;
    onClick: () => void;
  }[] = [
    {
      icon: Mic,
      title: "Record audio",
      desc: "Live transcription",
      color: "bg-accent/10 text-accent",
      onClick: () => router.push("/recording"),
    },
    {
      icon: AudioLines,
      title: "Audio / video",
      desc: "mp3, m4a, wav, mp4…",
      color: "bg-primary/10 text-primary",
      onClick: () => pickFile("audio/*,video/*"),
    },
    {
      icon: CirclePlay,
      title: "YouTube link",
      desc: "Paste a video URL",
      color: "bg-accent/10 text-accent",
      onClick: () => {
        setUrl("");
        setModal("youtube");
      },
    },
    {
      icon: FileText,
      title: "PDF document",
      desc: "Papers & textbooks",
      color: "bg-surface-2 text-ink",
      onClick: () => pickFile("application/pdf"),
    },
    {
      icon: ImageIcon,
      title: "Image",
      desc: "Slides & whiteboards",
      color: "bg-surface-2 text-ink",
      onClick: () => pickFile("image/*"),
    },
    {
      icon: NotebookPen,
      title: "Paste text",
      desc: "Articles & raw notes",
      color: "bg-primary/10 text-primary",
      onClick: () => {
        setTitle("");
        setText("");
        setModal("text");
      },
    },
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <button
            key={t.title}
            onClick={t.onClick}
            className="group rounded-lg border border-border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-md ${t.color}`}
            >
              <t.icon size={20} />
            </div>
            <div className="mt-3 font-display text-sm font-bold text-ink">
              {t.title}
            </div>
            <div className="mt-0.5 text-xs text-muted">{t.desc}</div>
          </button>
        ))}
      </div>

      {uploadPct !== null && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div className="flex justify-between text-sm font-medium text-primary">
            <span>Uploading…</span>
            <span>{uploadPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        </div>
      )}

      {error && !modal && (
        <div className="mt-4">
          <ErrorText>
            {error}
            {error.includes("Upgrade") && (
              <a href="/price" className="font-semibold underline">
                See plans
              </a>
            )}
          </ErrorText>
        </div>
      )}

      <input
        type="file"
        ref={fileInput}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
        }}
      />

      {/* YouTube modal */}
      <Modal
        open={modal === "youtube"}
        onClose={() => setModal(null)}
        title="New note from YouTube"
      >
        <Field label="Video URL">
          <input
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) createYoutube();
            }}
          />
        </Field>
        <p className="mt-2 text-xs text-muted">
          The video needs captions (most do). We&apos;ll fetch the transcript
          and write full notes.
        </p>
        {error && (
          <div className="mt-3">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button onClick={createYoutube} loading={busy} disabled={!url.trim()}>
            Create note
          </Button>
        </div>
      </Modal>

      {/* Paste text modal */}
      <Modal
        open={modal === "text"}
        onClose={() => setModal(null)}
        title="New note from text"
        wide
      >
        <div className="space-y-4">
          <Field label="Title (optional)">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 — Photosynthesis"
            />
          </Field>
          <Field label="Content">
            <textarea
              className={`${inputClass} min-h-56 resize-y font-mono text-[13px]`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an article, raw class notes, meeting minutes…"
            />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button
            onClick={createText}
            loading={busy}
            disabled={text.trim().length < 20}
          >
            Create note
          </Button>
        </div>
      </Modal>
    </div>
  );
}
