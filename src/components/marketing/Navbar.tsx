"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../Logo";
import ThemeSwitcher from "../ThemeSwitcher";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/price", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSignedIn(Boolean(d.user)))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          {signedIn ? (
            <Link
              href="/notes"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition hover:opacity-90"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition hover:opacity-90"
              >
                Start free
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-md p-2 text-ink md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-sm font-medium text-ink"
              >
                {l.label}
              </Link>
            ))}
            <div className="py-1">
              <ThemeSwitcher align="left" />
            </div>
            <Link
              href={signedIn ? "/notes" : "/login?mode=signup"}
              className="mt-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-ink"
            >
              {signedIn ? "Open workspace" : "Start free"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
