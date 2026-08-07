import React, { useState } from "react";
import { Archive, Search, ChevronDown, FolderOpen } from "lucide-react";
import moment from "moment";
import { formatDateTime } from "@/lib/dateFormat";

// Generic smart archive: records are filed automatically under Year → Month
// collapsible folders with search — reused across Safety, Complaints, etc.
// items: [{ id, date, title, text, badge? }]
export default function RecordSmartArchive({ items, lang, dir, emptyLabel }) {
  const ar = lang === "ar";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({});

  const filtered = (items || []).filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.title || "").toLowerCase().includes(q) || (it.text || "").toLowerCase().includes(q);
  });

  // Year → Month groups, newest first.
  const years = new Map();
  for (const it of filtered) {
    const m = moment(it.date);
    const y = m.year();
    const mk = m.format("YYYY-MM");
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y);
    if (!months.has(mk)) months.set(mk, []);
    months.get(mk).push(it);
  }
  const yearList = Array.from(years.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 ${dir === "rtl" ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ar ? "بحث في الأرشيف…" : "Search archive…"}
          className={`w-full ${dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 rounded-md border border-input text-sm font-body bg-background`}
        />
      </div>

      {yearList.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Archive className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground font-body">{emptyLabel || (ar ? "لا توجد سجلات مؤرشفة" : "No archived records")}</p>
        </div>
      ) : (
        yearList.map((year) => (
          <div key={year} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{year}</h3>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground font-body">
                {Array.from(years.get(year).values()).reduce((a, arr) => a + arr.length, 0)}
              </span>
            </div>
            {Array.from(years.get(year).keys()).sort().reverse().map((mk) => {
              const recs = years.get(year).get(mk).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
              const isOpen = !!open[mk];
              return (
                <div key={mk} className="rounded-xl border border-border bg-background overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [mk]: !o[mk] }))}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted transition-colors text-start"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </span>
                    <p className="text-sm font-medium font-body flex-1 min-w-0 truncate">
                      {moment(mk + "-01").locale(lang).format("MMMM YYYY")}
                    </p>
                    <span className="text-[11px] text-muted-foreground font-body shrink-0">{recs.length}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-3 space-y-2 border-t border-border/60">
                      {recs.map((it) => (
                        <div key={it.id} className="p-3 rounded-lg border border-border/60">
                          <div className="flex items-center justify-between gap-2 text-xs font-body text-muted-foreground">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{it.title}</span>
                              {it.badge && <span className="px-1.5 py-0.5 rounded-full border border-border text-[10px] shrink-0">{it.badge}</span>}
                            </span>
                            <span className="shrink-0">{formatDateTime(it.date, lang)}</span>
                          </div>
                          {it.text && <p className="text-sm font-body mt-1">{it.text}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}