import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

async function dailyReport(payload) {
  const res = await base44.functions.invoke("dailyReport", payload);
  return res?.data ?? res;
}

const FACT_META = {
  tasks: { ar: "مهام مُغلقة", en: "tasks closed", to: "/app/tasks" },
  hazards: { ar: "مخاطر مفتوحة", en: "open hazards", to: "/app/safety" },
  absence: { ar: "غياب غير مبرر", en: "unexcused absences", to: "/app/attendance" },
  proofs: { ar: "إثباتات معتمدة", en: "proofs approved", to: "/app/work-proof" },
};

const STATUS = {
  approved: { ar: "معتمد", en: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  ok: { ar: "مرفوع", en: "Submitted", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  late: { ar: "متأخر", en: "Late", cls: "bg-red-100 text-red-800 border-red-300" },
  review: { ar: "يحتاج مراجعة", en: "Needs review", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  missing: { ar: "لم يُرفع", en: "Not submitted", cls: "bg-muted text-muted-foreground border-border" },
};

export default function StationDailyBoard({ lang }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const [board, setBoard] = useState(null);
  const [busy, setBusy] = useState(false);

  const isManager = currentUser && (
    ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser.id
  );

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await dailyReport({ action: "board", companyId: company.id });
      if (remote?.rows) setBoard(remote);
    } catch {
      setBoard({ rows: [], summary: { total: 0, submitted: 0, late: 0, ready: 0, missing: 0 } });
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (action, extra = {}) => {
    setBusy(true);
    try {
      const remote = await dailyReport({ action, companyId: company.id, ...extra });
      if (remote?.error) {
        toast({ description: ar ? remote.reason : (remote.reasonEn || remote.error), variant: "destructive" });
      } else {
        if (action === "chase") {
          toast({ description: ar ? `أُرسل تنبيه إلى ${remote.count} محطة` : `Reminder sent to ${remote.count} stations` });
        }
        if (action === "issueSigned") {
          toast({ description: ar ? "صدرت حصيلة اليوم موقّعة." : "Signed daily record issued." });
        }
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!board) return <p className="text-sm text-muted-foreground">…</p>;
  const s = board.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "مرفوعة" : "Submitted", value: `${s.submitted || 0}/${s.total || 0}` },
          { label: ar ? "متأخرة عن الوردية" : "Past shift end", value: `${s.late || 0}` },
          { label: ar ? "متوسط وقت الرفع" : "Average submit time", value: s.avgSubmitTime || "—" },
          { label: ar ? "جاهزة للاعتماد" : "Ready to approve", value: `${s.ready || 0}` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <p className="font-heading text-xl font-semibold">{c.value}</p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {isManager && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || !s.ready} onClick={() => run("approveAll")} className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40">
            {busy && <Loader2 className="inline w-3 h-3 animate-spin me-1" />}
            {ar ? `اعتمد الجاهزة (${s.ready || 0})` : `Approve all ready (${s.ready || 0})`}
          </button>
          <button type="button" disabled={busy || !s.missing} onClick={() => run("chase")} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-40">
            {ar ? `طالِب المتأخرين (${s.missing || 0})` : `Chase outstanding (${s.missing || 0})`}
          </button>
          <button type="button" disabled={busy} onClick={() => run("issueSigned")} className="rounded-md border px-3 py-1.5 text-xs">
            {ar ? "أصدر حصيلة اليوم موقّعة" : "Issue the signed daily record"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(board.rows || []).map((row) => {
          const st = STATUS[row.status] || STATUS.missing;
          return (
            <div key={row.stationId} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading font-semibold">{row.stationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.filedBy ? `${row.filedBy} · ` : ""}{row.filedAt}
                    {row.lateChip && (
                      <span className="ms-2 inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] text-red-700">
                        {ar ? "رُفع متأخرًا" : "Filed late"}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`text-[10px] rounded-full border px-2 py-0.5 ${st.cls}`}>{ar ? st.ar : st.en}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(row.facts || []).map((f) => {
                  const meta = FACT_META[f.id];
                  const hot = f.bad && f.value > 0;
                  return (
                    <Link
                      key={f.id}
                      to={meta.to}
                      className={`inline-flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${hot ? "border-red-300 bg-red-50 text-red-800" : "border-border bg-muted/40"}`}
                    >
                      <span className="font-heading font-semibold">{f.value}</span>
                      <span>{ar ? meta.ar : meta.en}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {row.missing && (
                  <button type="button" disabled={busy} onClick={() => run("file", { stationId: row.stationId })} className="rounded-md border px-3 py-1.5 text-xs">
                    {ar ? "ارفع التقرير الآن" : "File the report now"}
                  </button>
                )}
                {isManager && row.canApprove && (
                  <button type="button" disabled={busy} onClick={() => run("approve", { stationId: row.stationId })} className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
                    {ar ? "اعتمد" : "Approve"}
                  </button>
                )}
                {isManager && row.filedAt !== "—" && !row.approved && (
                  <button type="button" disabled={busy} onClick={() => run("return", { stationId: row.stationId, reason: ar ? "يلزم تصحيح" : "Needs correction" })} className="rounded-md border px-3 py-1.5 text-xs">
                    {ar ? "أعِده للتصحيح" : "Return for correction"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {ar
          ? "اعتماد تقرير متأخر لا يمحو علامة التأخير — الحقلان منفصلان."
          : "Approving a late report never clears its lateness — the fields stay separate."}
      </p>
    </div>
  );
}
