"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

export default function FAQList({ items }: { items: FAQItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <span className="text-sm font-semibold text-slate-900 sm:text-[15px]">
              {item.q}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
            />
          </button>
          {openIdx === i && (
            <div className="px-5 pb-5 text-sm leading-6 text-slate-600">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
