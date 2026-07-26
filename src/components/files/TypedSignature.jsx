import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import { createTypedSignatureImage, createTypedSignatureWithDate } from "@/lib/typedSignatureImage";

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
  const [datedSignature, setDatedSignature] = useState("");
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
    const font = FONTS.find((item) => item.id === fontId);
    if (!samples[fontId] || !font || !name.trim()) return () => { active = false; };
    const date = new Date().toLocaleDateString("en-GB");
    createTypedSignatureWithDate(name.trim(), date, font.family)
      .then((rawSignature) => {
        if (!active) return null;
        setDatedSignature(rawSignature);
        return makeSignatureStamp(rawSignature, name.trim(), verificationId, "typed");
      })
      .then((composed) => { if (active && composed) { setStamp(composed); onPreview?.(composed); } });
    return () => { active = false; };
  }, [samples, fontId, name, verificationId, onPreview]);

  const save = () => onSave(datedSignature, name.trim(), "typed");
  const selectedFont = FONTS.find((font) => font.id === fontId);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border border-border bg-secondary/30 p-4"><label className="mb-2 block text-xs font-semibold text-foreground">{ar ? "1. اكتب اسم التوقيع" : "1. Enter signature name"}</label><input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring" /></div>
        <div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-foreground">{ar ? "2. اختر نمط الكتابة" : "2. Choose a writing style"}</p><span className="text-[10px] text-muted-foreground">{selectedFont?.label}</span></div><div className="max-h-[390px] overflow-y-auto rounded-xl border border-border bg-secondary/20 p-3"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{FONTS.map((font) => <button key={font.id} type="button" onClick={() => setFontId(font.id)} disabled={!samples[font.id]} className={`relative min-h-24 rounded-lg border p-2 text-center text-foreground transition disabled:opacity-50 ${fontId === font.id ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card hover:border-accent/50"}`}>{samples[font.id] && <img src={samples[font.id]} alt={font.label} className="mx-auto h-12 w-full object-contain" />}<span className="mt-1 block text-[9px] text-muted-foreground">{font.label}</span>{fontId === font.id && <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-3 w-3" /></span>}</button>)}</div></div></div>
      </div>
      <aside className="h-fit rounded-xl border border-accent/25 bg-secondary/30 p-4 lg:sticky lg:top-4"><p className="mb-3 text-xs font-semibold text-foreground">{ar ? "3. راجع واعتمد" : "3. Review and approve"}</p><div className="flex aspect-[3/2] items-center justify-center rounded-lg border border-border bg-card p-3">{stamp ? <img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="max-h-full w-full object-contain" /> : <p className="text-center text-xs text-muted-foreground">{ar ? "ستظهر المعاينة هنا بعد اختيار النمط." : "Your preview will appear here."}</p>}</div><button type="button" disabled={!stamp || saving} onClick={save} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد التوقيع" : "Approve signature"}</button></aside>
    </div>
  );
}