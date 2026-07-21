import React from "react";
import { PenLine, Type } from "lucide-react";

export default function PlacementToolbar({ ar, fieldType, setFieldType, signers, spots, active, setActive, colors }) {
  return (
    <div className="space-y-4 border-b border-border bg-landing-bg/40 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => setFieldType("signature")} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold ${fieldType === "signature" ? "border-accent bg-accent text-accent-foreground shadow-md" : "border-border bg-card text-foreground"}`}><PenLine className="h-5 w-5" />{ar ? "حقل توقيع" : "Signature field"}</button>
        <button onClick={() => setFieldType("text")} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold ${fieldType === "text" ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card text-foreground"}`}><Type className="h-5 w-5" />{ar ? "حقل نص" : "Text field"}</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {signers.map((signer, index) => {
          const signatures = (spots[index] || []).filter((field) => field.type === "signature").length;
          const texts = (spots[index] || []).filter((field) => field.type === "text").length;
          return <button key={signer.email || index} onClick={() => setActive(index)} className={`flex min-w-[170px] items-center gap-3 rounded-xl border p-3 text-start ${active === index ? "border-accent bg-card shadow-md" : "border-border bg-card/70"}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: colors[index % colors.length] }}>{index + 1}</span><span className="min-w-0"><span className="block truncate text-xs font-bold">{signer.name}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{signatures} {ar ? "توقيع" : "signatures"} · {texts} {ar ? "نص" : "text"}</span></span></button>;
        })}
      </div>
    </div>
  );
}