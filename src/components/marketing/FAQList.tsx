"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

export default function FAQList({ items }: { items: FAQItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={i}>
            <button
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              onClick={() => setOpenIdx(open ? null : i)}
            >
              <span className="font-display text-[15px] font-semibold text-ink">
                {item.q}
              </span>
              <Plus
                size={18}
                className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-45" : ""}`}
              />
            </button>
            {open && (
              <div className="pb-5 text-sm leading-7 text-muted">{item.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
