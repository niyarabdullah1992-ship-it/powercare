import React, { useState } from "react";
import { Info, X, SlidersHorizontal } from "lucide-react";
import RiskWeightsEditor from "@/components/dashboard/RiskWeightsEditor";
import { DEFAULT_RISK_WEIGHTS } from "@/lib/riskWeights";

export default function StabilityInfoPopover({ breakdown, riskScore, ar, companyId, canEditWeights }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const w = { ...DEFAULT_RISK_WEIGHTS, ...(breakdown.weights || {}) };
  const rows = [
    { label: ar ? "غياب اليوم" : "Absent today", count: breakdown.absentCount, weight: w.absent },
    { label: ar ? "مهام متأخرة / موعدها قريب" : "Delayed / due-soon tasks", count: breakdown.delayedTasks, weight: w.delayed },
    { label: ar ? "بلاغات توقف على المهام" : "Task stoppage issues", count: breakdown.stoppageCount, weight: w.stoppage },
    { label: ar ? "تقارير يومية معلقة" : "Pending daily reports", count: breakdown.pendingReports, weight: w.reports },
    ...(breakdown.criticalStations !== undefined ? [
      { label: ar ? "محطات سلامة حرجة" : "Critical safety stations", count: breakdown.criticalStations, weight: w.critical },
      { label: ar ? "حوادث سلامة (30 يوماً)" : "Safety incidents (30 days)", count: breakdown.recentIncidents, weight: w.incidents },
      { label: ar ? "مخاطر سلامة مفتوحة" : "Open safety hazards", count: breakdown.openHazards, weight: w.hazards },
    ] : []),
  ];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="absolute end-2 top-2 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white" title={ar ? "كيف يُحسب؟" : "How is this calculated?"}>
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-xl border border-white/15 bg-landing-olive p-4 text-start shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-landing-gold-light">{ar ? "كيف تُحسب نسبة الاستقرار؟" : "How stability is calculated"}</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-0.5 text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mb-2 text-[11px] leading-5 text-white/60">{ar ? "الاستقرار = 100 − نقاط المخاطر. النقاط تُحسب من بياناتك الحقيقية اليوم:" : "Stability = 100 − risk points, computed from your real data today:"}</p>
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 text-[11px] text-white/75">
                <span className="min-w-0">{r.label} (<span dir="ltr">{r.count} × {r.weight}</span>)</span>
                <span className="font-semibold text-white">{r.count * r.weight}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
            <span className="text-white/60">{ar ? "إجمالي نقاط المخاطر" : "Total risk points"}</span>
            <span className="font-semibold text-white">{riskScore}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60">{ar ? "نسبة الاستقرار" : "Stability score"}</span>
            <span className="font-semibold text-landing-gold-light">{100 - riskScore}%</span>
          </div>
          {canEditWeights && companyId && (
            <button type="button" onClick={() => setEditing(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-[11px] font-body text-white/80 hover:bg-white/10">
              <SlidersHorizontal className="h-3 w-3" /> {ar ? "تعديل الأوزان" : "Edit weights"}
            </button>
          )}
        </div>
        </div>
      )}
      {editing && (
        <RiskWeightsEditor companyId={companyId} weights={w} ar={ar} onClose={() => setEditing(false)} />
      )}
    </>
  );
}