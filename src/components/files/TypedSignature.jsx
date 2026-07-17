import React, { useState } from "react";
import { Check } from "lucide-react";

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

export default function TypedSignature({ ar, defaultName = "", onSave, saving }) {
  const [name, setName] = useState(defaultName);
  const [fontId, setFontId] = useState(FONTS[0].id);

  const save = async () => {
    const font = FONTS.find((f) => f.id === fontId);
    await document.fonts.load(`56px ${font.css}`, name);
    const canvas = document.createElement("canvas");
    canvas.width = 560;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 64;
    do {
      ctx.font = `${size}px ${font.css}`;
      size -= 4;
    } while (ctx.measureText(name).width > 520 && size > 20);
    ctx.fillText(name, 280, 80);
    onSave(canvas.toDataURL("image/png"), name.trim());
  };

  return (
    <div className="space-y-4">
      <input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FONTS.map((font) => (
          <button key={font.id} type="button" onClick={() => setFontId(font.id)} className={`rounded-xl border bg-card px-3 py-4 text-center text-foreground transition ${fontId === font.id ? "border-accent ring-2 ring-accent/30 shadow-sm" : "border-border hover:border-accent/50"}`}>
            <span dir="auto" className="block truncate text-2xl leading-tight" style={{ fontFamily: font.css }}>{name.trim() || (ar ? "توقيعك" : "Signature")}</span>
            <span className="mt-1 block text-[9px] text-muted-foreground">{font.label}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={!name.trim() || saving} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ وإرسال التوقيع" : "Save and submit signature"}</button>
      </div>
    </div>
  );
}