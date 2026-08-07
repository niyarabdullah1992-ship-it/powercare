import React, { useEffect, useState, useMemo } from "react";
import { ShieldAlert, Search, Download, RefreshCw, ChevronDown } from "lucide-react";
import { fetchAuditLog } from "@/lib/auditLog";
import { useI18n } from "@/lib/i18n";

// Full audit trail viewer for a company: search, filter by action type, CSV export.
export default function AuditLogPanel({ companyId }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [logs, setLogs] = useState(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setRefreshing(true);
    fetchAuditLog(companyId).then((l) => { setLogs(l); setRefreshing(false); });
  };
  useEffect(load, [companyId]);

  const actions = useMemo(() => [...new Set((logs || []).map((l) => l.action))].sort(), [logs]);
  const filtered = useMemo(() => (logs || []).filter((l) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (l.details || "").toLowerCase().includes(q) || (l.performedBy || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q);
  }), [logs, query, actionFilter]);

  const exportCsv = () => {
    const rows = [["Date", "Action", "Performed By", "Details"], ...filtered.map((l) => [
      new Date(l.created_date).toISOString(), l.action, l.performedBy || "", (l.details || "").replace(/"/g, '""'),
    ])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "audit-log.csv";
    a.click();
  };

  if (!logs) return null;

  const cleanDetails = (log) => {
    const details = log.details || "";
    if (!/_(added|removed)$/.test(log.action || "") || !details.includes(":")) return details;
    const [prefix, ...rest] = details.split(":");
    const uniqueNames = [...new Set(rest.join(":").split(",").map((name) => name.trim()).filter(Boolean))];
    return `${prefix}: ${uniqueNames.slice(0, 8).join(", ")}${uniqueNames.length > 8 ? ` +${uniqueNames.length - 8}` : ""}`;
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex items-center gap-2 text-start">
          <ShieldAlert className="w-4 h-4 text-accent" />
          <span className="font-heading font-semibold text-sm">{ar ? "سجل التدقيق" : "Audit Log"}</span>
          <span className="text-[10px] font-body text-muted-foreground">({filtered.length})</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="flex items-center gap-1.5">
          <button onClick={load} className="p-1.5 rounded-md hover:bg-muted" title={ar ? "تحديث" : "Refresh"}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCsv} disabled={!filtered.length} className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-border text-[11px] font-body hover:bg-muted disabled:opacity-40">
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>}
      </div>

      {open && <>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "بحث في السجل..." : "Search log..."}
            className="w-full ps-8 pe-2 py-1.5 rounded-md border border-input bg-background text-xs font-body"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-body max-w-[180px]"
        >
          <option value="all">{ar ? "كل العمليات" : "All actions"}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body">
          {ar ? "لا توجد عمليات مطابقة." : "No matching entries."}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((l) => {
            const details = cleanDetails(l);
            const long = details.length > 220;
            const expanded = expandedId === l.id;
            return (
              <div key={l.id} className="text-xs font-body p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px] shrink-0">{l.action}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-foreground break-words ${long && !expanded ? "line-clamp-3" : ""}`} dir="auto">{details}</p>
                    {long && <button onClick={() => setExpandedId(expanded ? null : l.id)} className="mt-1 text-[10px] text-accent hover:underline">{expanded ? (ar ? "عرض أقل" : "Show less") : (ar ? "عرض التفاصيل" : "Show details")}</button>}
                  </div>
                </div>
                <p className="text-muted-foreground mt-2" dir="auto">
                  {l.performedBy} · {new Date(l.created_date).toLocaleString(ar ? "ar" : "en")}
                </p>
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}