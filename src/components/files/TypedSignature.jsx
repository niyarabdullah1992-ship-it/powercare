import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import { createTypedSignatureImage } from "@/lib/typedSignatureImage";

// DocuSign-style typed signature: write your name, pick a script font,
// and it's rendered to a PNG exactly like a drawn signature.
const FONTS = [
  { id: "greatvibes", label: "Great Vibes", family: "'Great Vibes'" },
  { id: "dancing", label: "Dancing Script", family: "'Dancing Script'" },
  { id: "caveat", label: "Caveat", family: "'Caveat'" },
  { id: "pacifico", label: "Pacifico", family: "'Pacifico'" },
  { id: "allura", label: "Allura", family: "'Allura'" },
  { id: "alexbrush", label: "Alex Brush", family: "'Alex Brush'" },
  { id: "sacramento", label: "Sacramento", family: "'Sacramento'" },
  { id: "parisienne", label: "Parisienne", family: "'Parisienne'" },
  { id: "satisfy", label: "Satisfy", family: "'Satisfy'" },
  { id: "tangerine", label: "Tangerine", family: "'Tangerine'" },
  { id: "marck", label: "Marck Script", family: "'Marck Script'" },
  { id: "ruqaa", label: "رقعة", family: "'Aref Ruqaa'" },
  { id: "kufi", label: "كوفي", family: "'Reem Kufi'" },
  { id: "amiri", label: "أميري", family: "'Amiri'" },
  { id: "rakkas", label: "ركّاس", family: "'Rakkas'" },
  { id: "nastaliq", label: "نستعليق", family: "'Noto Nastaliq Urdu'" },
  { id: "lateef", label: "لطيف", family: "'Lateef'" },
];

export default function TypedSignature({ ar, defaultName = "", verificationId, onPreview, onSave, saving }) {
  const [name, setName] = useState(defaultName);
  const [fontId, setFontId] = useState(FONTS[0].id);
  const [samples, setSamples] = useState({});
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    let active = true;
    setSamples({}); setStamp(""); onPreview?.("");
    if (!name.trim()) return () => { active = false; };
    Promise.all(FONTS.map(async (font) => [font.id, await createTypedSignatureImage(name.trim(), font.family)]))
      .then((entries) => { if (active) setSamples(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, [name, onPreview]);

  useEffect(() => {
    let active = true;
    const rawSignature = samples[fontId];
    if (!rawSignature) return () => { active = false; };
    makeSignatureStamp(rawSignature, name.trim(), verificationId, "typed")
      .then((composed) => { if (active) { setStamp(composed); onPreview?.(composed); } });
    return () => { active = false; };
  }, [samples, fontId, defaultName, name, verificationId, onPreview]);

  const save = () => onSave(samples[fontId], name.trim(), "typed");

  return (
    <div className="space-y-5">
      <div><label className="mb-2 block text-xs font-medium text-muted-foreground">{ar ? "اسم التوقيع" : "Signature name"}</label><input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring" /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FONTS.map((font) => <button key={font.id} type="button" onClick={() => setFontId(font.id)} disabled={!samples[font.id]} className={`rounded-2xl border px-3 py-3 text-center text-foreground transition disabled:opacity-50 ${fontId === font.id ? "border-accent bg-secondary ring-2 ring-accent/20" : "border-border bg-card hover:bg-secondary"}`}>{samples[font.id] && <img src={samples[font.id]} alt={font.label} className="mx-auto h-12 w-full object-contain" />}<span className="mt-1 block text-[9px] text-muted-foreground">{font.label}</span></button>)}
      </div>
      {stamp && <div><p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المعاينة النهائية داخل الملف" : "Final in-document preview"}</p><img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="mx-auto w-full max-w-sm" /></div>}
      <button type="button" disabled={!stamp || saving} onClick={save} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد وإرسال التوقيع" : "Approve and submit signature"}</button>
    </div>
  );
}