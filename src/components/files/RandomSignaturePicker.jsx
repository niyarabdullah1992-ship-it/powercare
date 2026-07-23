import React, { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { createRandomSignature } from "@/lib/randomSignature";

export default function RandomSignaturePicker({ ar, signerName, verificationId, onSave, saving }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState("");
  const generate = () => {
    const seeds = new Uint32Array(6);
    crypto.getRandomValues(seeds);
    setOptions(Array.from(seeds, (seed) => createRandomSignature(seed, signerName)));
    setSelected("");
  };
  useEffect(generate, []);
  const approve = () => onSave(selected, signerName, "unique");
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-primary-foreground/70"><Sparkles className="h-4 w-4 text-accent" />{ar ? "اختر توقيعًا فريدًا؛ لن يتغير اختيارك تلقائيًا." : "Choose a unique signature; your selection will not change automatically."}</p><button type="button" onClick={generate} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary-foreground/25 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/10"><RefreshCw className="h-3.5 w-3.5" />{ar ? "نماذج جديدة" : "New set"}</button></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{options.map((signature, index) => <button key={signature} type="button" onClick={() => setSelected(signature)} className={`relative rounded-xl border bg-card p-2 transition ${selected === signature ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/60"}`}><img src={signature} alt={`${ar ? "توقيع" : "Signature"} ${index + 1}`} className="h-20 w-full object-contain" />{selected === signature && <span className="absolute end-2 top-2 rounded-full bg-accent p-1 text-accent-foreground"><Check className="h-3 w-3" /></span>}</button>)}</div>
    <button type="button" disabled={!selected || saving} onClick={approve} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "اعتماد هذا التوقيع" : "Approve this signature")}</button>
  </div>;
}