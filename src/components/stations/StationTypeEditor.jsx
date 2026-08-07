import React, { useState } from "react";
import { Check, X } from "lucide-react";

const PRESETS = ["stationTypeHq", "stationTypeBranch", "stationTypeCompany", "stationTypeInstitution"];

export default function StationTypeEditor({ t, onSave, onCancel }) {
  const [custom, setCustom] = useState("");

  return (
    <div className="space-y-2 p-2 rounded-md border border-border bg-background">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSave(t(key))}
            className="px-2.5 py-1 rounded-full text-[11px] font-body border border-border hover:bg-muted transition"
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && custom.trim()) { e.preventDefault(); onSave(custom.trim()); } if (e.key === "Escape") onCancel(); }}
          placeholder={t("customType")}
          className="flex-1 px-2 py-1 rounded-md border border-input text-xs font-body"
        />
        <button onClick={() => custom.trim() && onSave(custom.trim())} className="p-1 rounded-md hover:bg-accent/10 text-accent"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={onCancel} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}