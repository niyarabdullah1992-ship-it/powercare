import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

/** Recent PointsLedger rows from operations approvals — proves the E2E award path. */
export default function OpsPointsLedger({ companyId, employeeId = null, lang = "ar", limit = 12 }) {
  const ar = lang === "ar";
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!companyId) return undefined;
    setLoading(true);
    base44.functions.invoke("operations", {
      action: "ledger",
      companyId,
      sessionToken: getCompanyToken(companyId),
      employeeId: employeeId || undefined,
    }).then((res) => {
      if (!alive) return;
      const body = res?.data || res || {};
      setEntries(Array.isArray(body.entries) ? body.entries.slice(0, limit) : []);
      setTotal(Number(body.total) || 0);
    }).catch(() => {
      if (!alive) return;
      setEntries([]);
      setTotal(0);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [companyId, employeeId, limit]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold">
          {ar ? "سجل نقاط المهام (من الاعتماد)" : "Task points ledger (from approval)"}
        </h3>
        <span className="font-mono text-sm font-semibold" dir="ltr">{total}</span>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">{ar ? "جاري التحميل…" : "Loading…"}</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {ar ? "لا إدخالات بعد — اعتمد مهمة من العمليات لتظهر النقاط هنا." : "No entries yet — approve an Operations task to see points here."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id || `${e.targetId}-${e.awardedAt}`} className="flex items-center justify-between gap-2 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-medium">{e.taskTitle || e.targetId || "—"}</div>
                <div className="text-muted-foreground" dir="ltr">{String(e.awardedAt || "").slice(0, 16).replace("T", " ")}</div>
              </div>
              <span className="font-mono font-semibold text-emerald-700" dir="ltr">+{e.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
