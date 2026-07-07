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
      "bg-brand-600 text-white hover:bg-brand-700 shadow-sm disabled:bg-brand-300",
    secondary:
      "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50",
    ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      {children}
    </div>
  );
}
