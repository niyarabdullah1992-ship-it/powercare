import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, ChevronDown, X } from "lucide-react";
import { getGuide } from "@/lib/sectionGuides";

// Auto page guide: mounted once in the Layout, it shows a slim "how do I use
// this page?" bar on every section that has a guide defined.
export default function SectionGuide({ lang, t }) {
  const { pathname } = useLocation();
  const steps = getGuide(pathname, lang);
  const [open, setOpen] = useState(false);
  const hideKey = `pc_guide_hidden_${pathname}`;
  const [hidden, setHidden] = useState(() => !!localStorage.getItem(hideKey));

  // Collapse + re-check hidden flag when navigating between pages.
  useEffect(() => {
    setOpen(false);
    setHidden(!!localStorage.getItem(`pc_guide_hidden_${pathname}`));
  }, [pathname]);

  if (!steps || hidden) return null;
  const ar = lang === "ar";

  return (
    <div className="mb-4 rounded-xl border border-accent/25 bg-accent/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-start">
          <HelpCircle className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs font-body font-medium truncate">
            {ar ? "كيف أستخدم هذه الصفحة؟" : "How do I use this page?"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={() => { localStorage.setItem(hideKey, "1"); setHidden(true); }}
          className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
          title={ar ? "إخفاء الشرح لهذه الصفحة" : "Hide guide for this page"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <ol className="px-4 pb-3 space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-body leading-relaxed">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] flex items-center justify-center shrink-0 font-medium">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}