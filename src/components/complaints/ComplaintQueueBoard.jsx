import React, { useEffect, useState } from "react";
import { ArrowUpCircle, Check, Loader2, MessageSquareWarning } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  checkCloseGate,
  checkEscalateGate,
} from "@/lib/complaintDerivations";
import { toast } from "@/components/ui/use-toast";

async function complaintsApi(payload) {
  const res = await base44.functions.invoke("complaints", payload);
  return res?.data ?? res;
}

const KIND_LABEL = {
  anonymous: { ar: "مجهول", en: "Anonymous", cls: "border-border bg-muted text-foreground" },
  safety: { ar: "سلامة", en: "Safety", cls: "border-red-200 bg-red-50 text-red-700" },
  suggestion: { ar: "اقتراح", en: "Suggestion", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  facilities: { ar: "مرافق", en: "Facilities", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  public: { ar: "مُعرَّف", en: "Named", cls: "border-border bg-muted text-muted-foreground" },
};

function slaText(r, ar) {
  if (r.status !== "open" || r.slaHoursLeft == null) return "—";
  const h = r.slaHoursLeft;
  if (h < 0) {
    const overdue = Math.abs(h);
    if (overdue >= 24) {
      const d = Math.round(overdue / 24);
      return ar ? `تجاوز ${d} يومًا` : `${d}d overdue`;
    }
    return ar ? `تجاوز ${Math.round(overdue)} ساعات` : `${Math.round(overdue)}h overdue`;
  }
  if (h >= 24) {
    const d = Math.round(h / 24);
    return ar ? `${d} أيام` : `${d} days`;
  }
  return ar ? `${Math.round(h)} ساعات` : `${Math.round(h)}h`;
}

export default function ComplaintQueueBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [chain, setChain] = useState([]);
  const [busy, setBusy] = useState(false);

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.reports)) setReports(remote.reports);
    if (remote?.stats) setStats(remote.stats);
    if (Array.isArray(remote?.chain)) setChain(remote.chain);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      let remote = await complaintsApi({ action: "list", companyId: company.id });
      if (Array.isArray(remote?.reports) && remote.reports.length === 0) {
        remote = await complaintsApi({ action: "seedDemo", companyId: company.id });
      }
      applyRemote(remote);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await complaintsApi({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const escalate = async (report) => {
    const gate = checkEscalateGate(report, chain, { isHandler: true });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "escalate", reportId: report.id },
      ar ? "صُعّد البلاغ إلى المستوى التالي" : "Report escalated to the next level",
    );
  };

  const close = async (report) => {
    const gate = checkCloseGate(report, { isHandler: true });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "close", reportId: report.id, satisfaction: 86 },
      ar ? "أُغلق البلاغ" : "Report closed",
    );
  };

  if (!currentUser) return null;

  const statCards = [
    {
      label: ar ? "بلاغات مفتوحة" : "Open reports",
      value: stats?.openCount ?? "—",
      suffix: stats?.anonymousOpen
        ? (ar ? `${stats.anonymousOpen} منها مجهولة` : `${stats.anonymousOpen} anonymous`)
        : (ar ? "لا بلاغات مجهولة" : "none anonymous"),
    },
    {
      label: ar ? "متوسط زمن الاستجابة" : "Average response time",
      value: stats?.avgResponseHours ?? "—",
      suffix: ar ? "ساعات" : "hours",
      accent: true,
    },
    {
      label: ar ? "تجاوزت زمن الاستجابة" : "Breached SLA",
      value: stats?.breachedCount ?? "—",
      suffix: ar ? "صُعّدت تلقائيًا" : "auto-escalated",
      danger: true,
    },
    {
      label: ar ? "أُغلقت هذا الشهر" : "Closed this month",
      value: stats?.closedThisMonth ?? "—",
      suffix: stats?.avgSatisfaction != null
        ? (ar ? `بنسبة رضا ${stats.avgSatisfaction}٪` : `${stats.avgSatisfaction}% satisfaction`)
        : (ar ? "لا بلاغات مغلقة بعد" : "no reports closed yet"),
    },
  ];

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
              <span
                className={`font-heading text-2xl font-semibold tabular-nums ${
                  s.danger ? "text-red-600" : s.accent ? "text-accent" : "text-foreground"
                }`}
                dir="ltr"
              >
                {s.value}
              </span>
              <span className="text-[11px] text-muted-foreground">{s.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-accent" />
            <div>
              <div className="text-sm font-semibold">{ar ? "قائمة البلاغات" : "Report queue"}</div>
              <div className="text-[11px] text-muted-foreground">
                {ar
                  ? "البلاغات المجهولة تصل دون كشف هوية المُبلِّغ — تجاوز زمن الاستجابة يصعّد تلقائيًا"
                  : "Anonymous reports arrive without revealing the reporter — SLA breach auto-escalates"}
              </div>
            </div>
          </div>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="divide-y">
          {reports.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {ar ? "لا بلاغات في الطابور." : "No reports in the queue."}
            </div>
          )}
          {reports.map((r) => {
            const kind = KIND_LABEL[r.kind] || KIND_LABEL.public;
            const tier = ar ? r.currentTierLabelAr : r.currentTierLabelEn;
            return (
              <div key={r.id} className="space-y-2 px-4 py-3 hover:bg-muted/40">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${kind.cls}`}>
                    {kind[ar ? "ar" : "en"]}
                  </span>
                  <div className="min-w-0 flex-1 basis-[260px]">
                    <div className="text-sm font-medium text-foreground text-pretty">{r.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {[r.stationName, r.anonymousId || (r.reporterName ? (ar ? `بُلّغ عنه بواسطة ${r.reporterName}` : `reported by ${r.reporterName}`) : null)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="min-w-[96px]">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {ar ? "المتبقي" : "Remaining"}
                    </div>
                    <div className={`text-xs font-semibold ${r.slaBreached ? "text-red-600" : r.slaHoursLeft != null && r.slaHoursLeft < 8 ? "text-amber-700" : "text-muted-foreground"}`}>
                      {slaText(r, ar)}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {r.lastEscalationReason === "SLA_BREACH"
                      ? (ar ? `صُعّد تلقائيًا · ${tier}` : `Auto-escalated · ${tier}`)
                      : (ar ? `لدى ${tier}` : `With ${tier}`)}
                  </span>
                  {r.status === "open" && !r.atTop && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => escalate(r)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-accent bg-white px-2.5 text-[11px] font-semibold text-accent disabled:opacity-50"
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5" />
                      {ar ? "صعّد" : "Escalate"}
                    </button>
                  )}
                  {r.status === "open" && r.atTop && (
                    <span className="rounded-md border bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      {ar ? "أعلى مستوى" : "Top tier"}
                    </span>
                  )}
                  {r.status === "open" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => close(r)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {ar ? "أغلق" : "Close"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="me-1 text-[9px] tracking-wide text-muted-foreground">
                    {ar ? "سلسلة التصعيد" : "Escalation chain"}
                  </span>
                  {(r.steps || []).map((st, i) => (
                    <span
                      key={st.id || i}
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        st.state === "current" ? "font-semibold text-accent" : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          st.state === "done"
                            ? "bg-border"
                            : st.state === "current"
                              ? "bg-accent"
                              : "border border-border bg-white"
                        }`}
                      />
                      {ar ? st.labelAr : st.labelEn}
                      {i < (r.steps?.length || 0) - 1 && (
                        <span className={`mx-0.5 h-px w-3.5 ${st.state === "done" ? "bg-border" : "bg-border/60"}`} />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
