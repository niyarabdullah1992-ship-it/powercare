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

const ENGLISH_FONTS = FONTS.slice(0, 11);
const ARABIC_FONTS = FONTS.slice(11);

export default function TypedSignature({ ar, defaultName = "", verificationId, onPreview, onSave, saving }) {
  const availableFonts = ar ? ARABIC_FONTS : ENGLISH_FONTS;
  const [name, setName] = useState(defaultName);
  const [fontId, setFontId] = useState(() => (ar ? ARABIC_FONTS[0].id : ENGLISH_FONTS[0].id));
  const [samples, setSamples] = useState({});
  const [datedSignature, setDatedSignature] = useState("");
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    const languageFonts = ar ? ARABIC_FONTS : ENGLISH_FONTS;
    if (!languageFonts.some((font) => font.id === fontId)) setFontId(languageFonts[0].id);
  }, [ar, fontId]);

  useEffect(() => {
    let active = true;
    setSamples({}); setStamp(""); onPreview?.("");
    if (!name.trim()) return () => { active = false; };
    Promise.all(availableFonts.map(async (font) => [font.id, await createTypedSignatureImage(name.trim(), font.family)]))
      .then((entries) => { if (active) setSamples(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, [name, ar, onPreview]);

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
    <div className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[minmax(0,1fr)_160px]">
      <div className="grid gap-2 p-2.5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">{ar ? "اسم التوقيع" : "Signature name"}</label>
          <input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-body outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-xs font-semibold text-foreground">{ar ? "نمط الكتابة" : "Writing style"}</label><span className="text-[10px] text-muted-foreground">{selectedFont?.label}</span></div>
          <select value={fontId} onChange={(event) => setFontId(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring">
            {availableFonts.map((font) => <option key={font.id} value={font.id}>{font.label}</option>) }
          </select>
        </div>
      </div>
      <aside className="border-t border-border bg-secondary/25 p-2.5 md:border-s md:border-t-0">
        <p className="mb-1 text-[11px] font-semibold text-foreground">{ar ? "المعاينة النهائية" : "Final preview"}</p>
        <div className="flex h-14 items-center justify-center rounded-md border border-border bg-card p-1.5">{stamp ? <img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="max-h-full w-full object-contain" /> : <p className="text-center text-[10px] text-muted-foreground">{ar ? "ستظهر المعاينة هنا." : "Preview appears here."}</p>}</div>
        <button type="button" disabled={!stamp || saving} onClick={save} className="mt-1.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-3.5 w-3.5" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد التوقيع" : "Approve signature"}</button>
      </aside>
    </div>
  );
}