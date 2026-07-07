import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8546fb" />
          <stop offset="1" stopColor="#5b13b1" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#logo-g)" />
      <path
        d="M20 20h24M20 30h24M20 40h14"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="9" fill="#fff" />
      <path
        d="M40.5 44l2.5 2.5 5-5"
        stroke="#7c22f3"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      className={`flex items-center gap-2 font-bold text-slate-900 ${className}`}
    >
      <LogoMark size={size} />
      <span className="text-lg tracking-tight">
        Easy<span className="text-brand-600">Note</span>
      </span>
    </Link>
  );
}
