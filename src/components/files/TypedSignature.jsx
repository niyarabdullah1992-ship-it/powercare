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
    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0 space-y-3">
        <div className="rounded-lg border border-border bg-secondary/20 p-2.5 sm:flex sm:items-center sm:gap-3">
          <label className="mb-1.5 block shrink-0 text-xs font-semibold text-foreground sm:mb-0">{ar ? "1. اسم التوقيع" : "1. Signature name"}</label>
          <input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-3"><p className="text-xs font-semibold text-foreground">{ar ? "2. نمط الكتابة" : "2. Writing style"}</p><span className="truncate text-[10px] text-muted-foreground">{selectedFont?.label}</span></div>
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary/20 p-2 no-scrollbar">
            <div className="flex w-max gap-2">{FONTS.map((font) => <button key={font.id} type="button" onClick={() => setFontId(font.id)} disabled={!samples[font.id]} className={`relative h-[74px] w-36 shrink-0 rounded-md border px-2 py-1.5 text-center text-foreground transition disabled:opacity-50 ${fontId === font.id ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card hover:border-accent/50"}`}>{samples[font.id] && <img src={samples[font.id]} alt={font.label} className="mx-auto h-9 w-full object-contain" />}<span className="block text-[9px] text-muted-foreground">{font.label}</span>{fontId === font.id && <span className="absolute end-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-2.5 w-2.5" /></span>}</button>)}</div>
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-lg border border-accent/25 bg-secondary/20 p-2.5"><p className="mb-1.5 text-xs font-semibold text-foreground">{ar ? "3. راجع واعتمد" : "3. Review and approve"}</p><div className="flex h-28 items-center justify-center rounded-md border border-border bg-card p-2">{stamp ? <img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="max-h-full w-full object-contain" /> : <p className="text-center text-[10px] text-muted-foreground">{ar ? "ستظهر المعاينة هنا." : "Preview appears here."}</p>}</div><button type="button" disabled={!stamp || saving} onClick={save} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-3.5 w-3.5" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد التوقيع" : "Approve signature"}</button></aside>
    </div>
  );
}