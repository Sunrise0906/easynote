"use client";

import { Loader2, X } from "lucide-react";
import { useEffect } from "react";

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  loading,
  type = "button",
  className = "",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-primary text-primary-ink hover:opacity-90 shadow-[var(--shadow-soft)] disabled:opacity-50",
    secondary:
      "border border-border bg-surface text-ink hover:border-ink/30 disabled:opacity-50",
    ghost: "text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50",
    danger:
      "bg-accent text-accent-ink hover:opacity-90 shadow-[var(--shadow-soft)] disabled:opacity-50",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${styles[variant]} ${className}`}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-fade-up w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)]`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring";

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-md border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-sm text-ink">
      {children}
    </div>
  );
}
