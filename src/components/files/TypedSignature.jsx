import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";

// DocuSign-style typed signature: write your name, pick a script font,
// and it's rendered to a PNG exactly like a drawn signature.
const FONTS = [
  { id: "greatvibes", label: "Great Vibes", css: "'Great Vibes', cursive" },
  { id: "dancing", label: "Dancing Script", css: "'Dancing Script', cursive" },
  { id: "caveat", label: "Caveat", css: "'Caveat', cursive" },
  { id: "pacifico", label: "Pacifico", css: "'Pacifico', cursive" },
  { id: "ruqaa", label: "رقعة", css: "'Aref Ruqaa', serif" },
  { id: "kufi", label: "كوفي", css: "'Reem Kufi', sans-serif" },
];

export default function TypedSignature({ ar, defaultName = "", verificationId, onPreview, onSave, saving }) {
  const [name, setName] = useState(defaultName);
  const [fontId, setFontId] = useState(FONTS[0].id);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    let active = true;
    if (!name.trim()) { setStamp(""); onPreview(""); return; }
    (async () => {
      const font = FONTS.find((item) => item.id === fontId);
      await document.fonts.load(`56px ${font.css}`, name);
      const canvas = document.createElement("canvas");
      canvas.width = 560;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 64;
      do { ctx.font = `${size}px ${font.css}`; size -= 4; } while (ctx.measureText(name).width > 520 && size > 20);
      ctx.fillText(name, 280, 80);
      const composed = await makeSignatureStamp(canvas.toDataURL("image/png"), defaultName || name.trim(), verificationId);
      if (active) { setStamp(composed); onPreview(composed); }
    })();
    return () => { active = false; };
  }, [name, fontId, defaultName, verificationId, onPreview]);

  const save = () => onSave(stamp, true);

  return (
    <div className="space-y-5">
      <div><label className="mb-2 block text-xs font-medium text-muted-foreground">{ar ? "اسم التوقيع" : "Signature name"}</label><input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring" /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FONTS.map((font) => <button key={font.id} type="button" onClick={() => setFontId(font.id)} className={`rounded-2xl border px-3 py-4 text-center text-foreground transition ${fontId === font.id ? "border-accent bg-secondary ring-2 ring-accent/20" : "border-border bg-card hover:bg-secondary"}`}><span dir="auto" className="block truncate text-2xl leading-tight" style={{ fontFamily: font.css }}>{name.trim() || (ar ? "توقيعك" : "Signature")}</span><span className="mt-2 block text-[9px] text-muted-foreground">{font.label}</span></button>)}
      </div>
      {stamp && <div><p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المعاينة النهائية داخل الملف" : "Final in-document preview"}</p><img src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} className="mx-auto w-full max-w-sm" /></div>}
      <button type="button" disabled={!stamp || saving} onClick={save} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد وإرسال التوقيع" : "Approve and submit signature"}</button>
    </div>
  );
}