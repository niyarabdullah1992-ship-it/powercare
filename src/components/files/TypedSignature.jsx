import React, { useEffect, useState } from "react";
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
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <label className="pointer-events-none absolute end-5 top-2 z-10 text-[10px] font-semibold text-signature-organic">{ar ? "اسم التوقيع" : "Signature name"}</label>
        <input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="h-14 w-full !rounded-full !border-0 !bg-signature-ink px-5 pb-1 pt-5 text-[11px] !text-signature-organic placeholder:text-signature-organic/55 outline-none focus:ring-2 focus:ring-signature-ink/30" />
      </div>
      <div className="relative">
        <label className="pointer-events-none absolute end-5 top-2 z-10 text-[10px] font-semibold text-signature-organic">{ar ? "نمط الكتابة" : "Writing style"}</label>
        <select value={fontId} onChange={(event) => setFontId(event.target.value)} className="h-14 w-full appearance-none !rounded-full !border-0 !bg-signature-ink px-5 pb-1 pt-5 text-[11px] !text-signature-organic outline-none focus:ring-2 focus:ring-signature-ink/30">
          {availableFonts.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
        </select>
      </div>
      <button type="button" disabled={!stamp || saving} onClick={save} className="inline-flex h-11 w-full items-center justify-center !rounded-full border-2 border-signature-ink bg-transparent px-4 text-xs font-bold text-signature-ink disabled:opacity-40">{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد التوقيع" : "Approve signature"}</button>
    </div>
  );
}