import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { updateCompany } from "@/lib/store";
import { DEFAULT_RISK_WEIGHTS } from "@/lib/riskWeights";

const FIELDS = [
  { key: "absent", ar: "غياب اليوم (لكل موظف)", en: "Absent today (per employee)" },
  { key: "delayed", ar: "مهمة متأخرة / موعدها قريب", en: "Delayed / due-soon task" },
  { key: "stoppage", ar: "بلاغ توقف على مهمة", en: "Task stoppage issue" },
  { key: "reports", ar: "تقرير يومي معلق", en: "Pending daily report" },
  { key: "critical", ar: "محطة سلامة حرجة", en: "Critical safety station" },
  { key: "incidents", ar: "حادث سلامة (30 يوماً)", en: "Safety incident (30 days)" },
  { key: "hazards", ar: "خطر سلامة مفتوح", en: "Open safety hazard" },
];

// Owner-only modal: customize the points each risk factor contributes to the
// stability score. Saved per-company in settings.riskWeights.
export default function RiskWeightsEditor({ companyId, weights, ar, onClose }) {
  const [values, setValues] = useState({ ...weights });

  const save = () => {
    updateCompany(companyId, (d) => {
      d.settings = d.settings || {};
      d.settings.riskWeights = Object.fromEntries(
        FIELDS.map((f) => [f.key, Math.max(0, Math.min(100, Number(values[f.key]) || 0))])
      );
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-5 text-start shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{ar ? "تعديل أوزان المخاطر" : "Edit risk weights"}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-[11px] leading-5 text-muted-foreground font-body">
          {ar ? "حدد عدد نقاط المخاطر لكل عامل حسب طبيعة عمل شركتك. الأخطر يستحق وزناً أعلى." : "Set risk points per factor to match your operation. Riskier factors deserve higher weights."}
        </p>
        <div className="space-y-2.5">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm font-body">
              <span className="min-w-0">{ar ? f.ar : f.en}</span>
              <input
                type="number" min="0" max="100" dir="ltr"
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-20 shrink-0 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setValues({ ...DEFAULT_RISK_WEIGHTS })} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
            <RotateCcw className="h-3.5 w-3.5" /> {ar ? "الافتراضي" : "Defaults"}
          </button>
          <button type="button" onClick={save} className="rounded-md bg-foreground px-4 py-2 text-sm font-body text-background hover:opacity-90">
            {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}