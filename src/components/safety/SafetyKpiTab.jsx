import React from "react";
import { safetyKpis } from "@/lib/safetyStandards";

function KpiBar({ label, value, target, inverse = true }) {
  const ratio = target ? Math.min(100, (value / target) * 100) : 0;
  const good = inverse ? value <= target : value >= target;
  return <div className="rounded-lg border border-border p-3 space-y-2"><div className="flex justify-between text-xs font-body"><span>{label}</span><strong>{value.toFixed(2)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${good ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${ratio}%` }} /></div><p className="text-[10px] text-muted-foreground">Target: {target}</p></div>;
}

export default function SafetyKpiTab({ rec, canEdit, lang, onUpdate }) {
  const ar = lang === "ar";
  const L = (a, e) => ar ? a : e;
  const kpi = safetyKpis(rec);
  return <div className="space-y-4">
    <div className="rounded-xl border border-accent/25 bg-accent/10 p-5 text-center"><p className="text-xs text-muted-foreground">{L("أيام بدون حوادث", "Days without incidents")}</p><p className="font-heading text-5xl font-semibold text-accent">{kpi.days}</p></div>
    <div className="grid grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">{L("ساعات العمل الشهرية", "Monthly work hours")}<input disabled={!canEdit} type="number" min="0" value={rec?.workHoursMonthly || ""} onChange={(e) => onUpdate({ workHoursMonthly: Number(e.target.value) || 0 })} className="mt-1 w-full rounded-md border border-input px-2 py-1.5" /></label><label className="text-xs text-muted-foreground">{L("حوادث الوقت الضائع LTI", "Lost-time injuries (LTI)")}<input disabled={!canEdit} type="number" min="0" value={rec?.ltiCount || ""} onChange={(e) => onUpdate({ ltiCount: Number(e.target.value) || 0 })} className="mt-1 w-full rounded-md border border-input px-2 py-1.5" /></label></div>
    {!rec?.workHoursMonthly && <p className="text-[11px] text-amber-600">{L("أدخل ساعات العمل لتفعيل الحسابات.", "Enter work hours to activate calculations.")}</p>}
    <KpiBar label="TRIR" value={kpi.trir} target={3} /><KpiBar label="LTIFR" value={kpi.ltifr} target={1} />
    <p className="text-[10px] text-muted-foreground">TRIR = ({kpi.incidents} × 200,000) ÷ {rec?.workHoursMonthly || 0} · LTIFR = ({rec?.ltiCount || 0} × 1,000,000) ÷ {rec?.workHoursMonthly || 0}</p>
    <p className="text-[10px] text-muted-foreground">{L("تُحتسب إصابات الوقت الضائع LTI ضمن حوادث TRIR القابلة للتسجيل.", "Lost-time injuries (LTI) are included in TRIR recordable incidents.")}</p>
  </div>;
}