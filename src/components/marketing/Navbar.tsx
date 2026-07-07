"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../Logo";

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
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <Link
              href="/notes"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-sm font-medium text-slate-700"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={signedIn ? "/notes" : "/login?mode=signup"}
              className="mt-2 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              {signedIn ? "Open dashboard" : "Get started free"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
