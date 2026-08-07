import React from "react";
import { Lock } from "lucide-react";

const ROWS = [
  { id: "photos", ar: "صور قبل وبعد التنفيذ", en: "Before / after photos" },
  { id: "locationTime", ar: "الموقع والوقت الموثّقان", en: "Verified location & time" },
  { id: "safetyApproval", ar: "اعتماد مسؤول السلامة", en: "Safety officer attestation" },
  { id: "materials", ar: "المواد المصروفة (بلا تكاليف)", en: "Materials issued (no costs)" },
];
const LOCKED = [
  { id: "names", ar: "أسماء المنفّذين", en: "Executor names" },
  { id: "costs", ar: "تكاليف المواد المصروفة", en: "Material costs" },
];

function Toggle({ on, locked, onClick }) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${locked ? "bg-muted" : on ? "bg-accent" : "bg-input"}`}
      role="switch"
      aria-checked={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`} />
    </button>
  );
}

// "What the client sees" — locked fields are never sent, not merely hidden.
export default function ProofDisclosurePanel({ value, onChange, ar }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold font-heading">{ar ? "ما يظهر للعميل" : "What the client sees"}</h3>
      <div className="mt-3 space-y-2.5">
        {ROWS.map((row) => (
          <label key={row.id} className="flex items-center justify-between gap-3 text-sm font-body">
            <span>{ar ? row.ar : row.en}</span>
            <Toggle on={value[row.id]} onClick={() => onChange({ ...value, [row.id]: !value[row.id] })} />
          </label>
        ))}
        {LOCKED.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 text-sm text-muted-foreground/70 font-body">
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" />{ar ? row.ar : row.en}</span>
            <Toggle on={false} locked />
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground font-body">
        {ar ? "الحقول المغلقة لا تُرسَل أصلًا — لا تُخفى بالعرض فقط." : "Locked fields are never sent at all — not merely hidden in the view."}
      </p>
    </section>
  );
}