import React from "react";
import { Palette } from "lucide-react";

const themes = [
  { id: "balanced", ar: "متوازن مؤسسي", en: "Balanced corporate", dots: ["#f8f9fa", "#6d28d9"] },
  { id: "executive", ar: "تنفيذي فاخر", en: "Executive luxury", dots: ["#0f172a", "#c9a227"] },
  { id: "clean", ar: "نظيف احترافي", en: "Clean professional", dots: ["#ffffff", "#2563eb"] },
];

export default function SigningThemePicker({ value, onChange, ar }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Palette className="h-4 w-4 text-[var(--signing-accent)]" />
      {themes.map((theme) => (
        <button key={theme.id} type="button" onClick={() => onChange(theme.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${value === theme.id ? "border-[var(--signing-accent)] bg-[var(--signing-accent-soft)] text-[var(--signing-accent)]" : "border-border bg-card text-muted-foreground"}`}>
          <span className="flex -space-x-1 rtl:space-x-reverse">{theme.dots.map((color) => <i key={color} className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: color }} />)}</span>
          {ar ? theme.ar : theme.en}
        </button>
      ))}
    </div>
  );
}