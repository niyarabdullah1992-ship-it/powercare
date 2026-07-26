import React from "react";
import { Check } from "lucide-react";
import { SIGNATURE_STAMP_THEMES } from "@/lib/signatureStampThemes";
import StampFingerprintPreview from "@/components/files/StampFingerprintPreview";

export default function SignatureThemePicker({ value, onChange, ar }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "تصميم الختم" : "Stamp design"}</p>
      <div className="grid grid-cols-2 gap-2">
        {SIGNATURE_STAMP_THEMES.map((theme) => {
          const selected = value === theme.id;
          return (
            <button key={theme.id} type="button" onClick={() => onChange(theme.id)} className={`relative rounded-lg border p-1.5 text-start ${selected ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card"}`}>
              <span className={`flex h-11 items-center gap-1.5 bg-primary px-2 ${theme.preview}`}>
                <StampFingerprintPreview theme={theme.id} />
                <span className="space-y-1.5 flex-1"><span className="block h-px bg-accent/70" /><span className="block h-px w-3/4 bg-accent/40" /></span>
                <span className="h-6 w-6 border border-accent/80" />
              </span>
              <span className="mt-1 block text-[10px] font-semibold">{ar ? theme.ar : theme.en}</span>
              {selected && <Check className="absolute end-2 top-2 h-3.5 w-3.5 text-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}