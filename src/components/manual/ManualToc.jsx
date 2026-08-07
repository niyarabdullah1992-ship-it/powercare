import React from "react";

export default function ManualToc({ chapters, labels }) {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <>
      <div className="no-print lg:hidden">
        <select onChange={(event) => jump(event.target.value)} defaultValue="" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <option value="" disabled>{labels.toc}</option>
          {chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </div>
      <nav className="manual-toc-export hidden rounded-2xl border border-accent/20 bg-card p-4 shadow-soft lg:sticky lg:top-24 lg:block">
        <h2 className="font-heading text-xl font-semibold">{labels.toc}</h2>
        <div className="mt-3 max-h-[calc(100vh-9rem)] space-y-1 overflow-y-auto pe-1 no-scrollbar">
          {chapters.map((item) => <a key={item.id} href={`#${item.id}`} className="block rounded-lg px-3 py-2 text-xs leading-5 text-muted-foreground hover:bg-accent/10 hover:text-accent">{item.title}</a>)}
        </div>
      </nav>
    </>
  );
}