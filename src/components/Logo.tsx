import Link from "next/link";

/**
 * Recall mark: a bracketed dot returning to the line — "recall" as retrieval.
 * Uses currentColor + the primary token so it recolors per theme.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="8"
        className="fill-surface stroke-border"
        strokeWidth="1.5"
      />
      <path
        d="M10 9v14"
        className="stroke-ink"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M15 9c4.4 0 6.6 2 6.6 5.1 0 2.5-1.6 4.2-4.3 4.8L22 23"
        className="stroke-ink"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23.5" cy="9.5" r="2.4" className="fill-primary" />
    </svg>
  );
}

export function Logo({
  href = "/home",
  size = 30,
  className = "",
}: {
  href?: string;
  size?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 text-ink ${className}`}
    >
      <LogoMark size={size} />
      <span className="font-display text-[1.15rem] font-bold tracking-tight">
        Recall
      </span>
    </Link>
  );
}
