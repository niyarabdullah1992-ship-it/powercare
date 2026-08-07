import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, X } from "lucide-react";
import { getGuide } from "@/lib/sectionGuides";

export default function SectionGuide({ lang }) {
  const { pathname } = useLocation();
  const steps = getGuide(pathname, lang);
  const [open, setOpen] = useState(false);
  const ar = lang === "ar";

  useEffect(() => setOpen(false), [pathname]);
  if (!steps) return null;

  return <>
    <button onClick={() => setOpen(true)} aria-label={ar ? "فتح دليل القسم" : "Open section guide"} title={ar ? "دليل القسم" : "Section guide"} className="fixed bottom-24 end-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-card text-accent shadow-soft hover:bg-accent hover:text-accent-foreground md:bottom-6 md:end-6">
      <BookOpen className="h-4 w-4" />
    </button>
    {open && <div className="fixed inset-0 z-[70] bg-foreground/35" onClick={() => setOpen(false)}>
      <aside dir={ar ? "rtl" : "ltr"} className="absolute inset-y-0 end-0 flex w-full max-w-sm flex-col border-s border-border bg-card shadow-elevated" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><p className="text-xs font-medium uppercase tracking-wider text-accent">{ar ? "إرشادات الاستخدام" : "Usage guidance"}</p><h2 className="font-heading text-xl font-semibold">{ar ? "كيف أستخدم هذا القسم؟" : "How do I use this section?"}</h2></div>
          <button onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </header>
        <ol className="flex-1 space-y-4 overflow-y-auto p-5">{steps.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm leading-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{index + 1}</span><span>{step}</span></li>)}</ol>
      </aside>
    </div>}
  </>;
}