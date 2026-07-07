import Link from "next/link";
import { Logo } from "../Logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/price", label: "Pricing" },
      { href: "/notes", label: "Dashboard" },
      { href: "/recording", label: "Live recording" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/faq#subscription", label: "Billing help" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
            Turn lectures, meetings, videos and documents into notes,
            flashcards, quizzes and mind maps — automatically.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold text-slate-900">
              {col.title}
            </div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-slate-500 transition hover:text-slate-900"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EasyNote. Built for curious minds.
      </div>
    </footer>
  );
}
