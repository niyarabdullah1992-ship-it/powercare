import React, { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { createRandomSignature } from "@/lib/randomSignature";

export default function RandomSignaturePicker({ ar, signerName, onPreview, onSave, saving }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState("");
  const generate = () => {
    const seeds = new Uint32Array(6);
    crypto.getRandomValues(seeds);
    setOptions(Array.from(seeds, (seed) => createRandomSignature(seed, signerName)));
    setSelected("");
    onPreview?.("");
  };
  const selectSignature = (signature) => {
    setSelected(signature);
    onPreview?.(signature);
  };
  useEffect(generate, []);
  const approve = () => onSave(selected, signerName, "unique");
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-signature-ink/75"><Sparkles className="h-4 w-4" />{ar ? "اختر قالبًا جاهزًا باسمك." : "Choose a ready-made template with your name."}</p><button type="button" onClick={generate} className="inline-flex shrink-0 items-center gap-1.5 !rounded-full border border-signature-ink/30 px-3 py-2 text-xs font-semibold text-signature-ink hover:bg-signature-ink/5"><RefreshCw className="h-3.5 w-3.5" />{ar ? "قوالب جديدة" : "New set"}</button></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((signature, index) => <button key={signature} type="button" onClick={() => selectSignature(signature)} className={`relative aspect-[3/1] overflow-hidden rounded-xl border bg-card p-3 transition ${selected === signature ? "border-signature-ink ring-2 ring-signature-ink/25" : "border-signature-ink/15 hover:border-signature-ink/45"}`}><img src={signature} alt={`${ar ? "توقيع" : "Signature"} ${index + 1}`} className="h-full w-full object-contain" />{selected === signature && <span className="absolute end-2 top-2 rounded-full bg-signature-ink p-1 text-signature-organic"><Check className="h-3 w-3" /></span>}</button>)}</div>
    <button type="button" disabled={!selected || saving} onClick={approve} className="inline-flex w-full items-center justify-center gap-2 !rounded-full border-2 border-signature-ink px-5 py-3 text-sm font-semibold text-signature-ink disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "اعتماد هذا التوقيع" : "Approve this signature")}</button>
  </div>;
}