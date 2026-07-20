import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function MovementBalancePanel({ label, name, before, after, recipient, tone = "source", ar }) {
  const destination = tone === "destination";
  const panelTone = destination
    ? "border-emerald-600/25 bg-emerald-600/5"
    : "border-destructive/25 bg-destructive/5";
  const valueTone = destination ? "text-emerald-700" : "text-destructive";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return <div className={`rounded-xl border p-4 ${panelTone}`}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{name}</p></div>
      <span className={`h-2.5 w-2.5 rounded-full ${destination ? "bg-emerald-600" : "bg-destructive"}`} />
    </div>
    {recipient ? <p className="mt-5 rounded-lg bg-card/70 px-3 py-2 text-center text-sm font-medium">{recipient}</p> :
      <div dir={ar ? "rtl" : "ltr"} className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-card/70 p-2">
        <div><p className="text-[10px] text-muted-foreground">{ar ? "قبل" : "Before"}</p><b className={`text-xl ${valueTone}`}>{before}</b></div>
        <Arrow className="h-5 w-5 text-accent" />
        <div><p className="text-[10px] text-muted-foreground">{ar ? "بعد" : "After"}</p><b className={`text-xl ${valueTone}`}>{after}</b></div>
      </div>}
  </div>;
}