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
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        dir="auto"
        placeholder={ar ? "اكتب اسمك…" : "Type your name…"}
        className="w-full max-w-[420px] px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        disabled={!name.trim() || saving}
        onClick={save}
        className="flex w-full max-w-[420px] items-center justify-center gap-1.5 rounded-md bg-foreground px-4 py-2.5 text-sm font-body text-background disabled:opacity-40"
      >
        <Check className="w-4 h-4" /> {saving ? (ar ? "جارٍ حفظ التوقيع…" : "Saving signature…") : ar ? "حفظ التوقيع وتفعيله" : "Save & activate signature"}
      </button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-[560px]">
        {FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFontId(f.id)}
            className={`px-3 py-2.5 rounded-lg border bg-white text-slate-800 text-center transition ${fontId === f.id ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/50"}`}
          >
            <span dir="auto" className="block truncate text-2xl leading-tight" style={{ fontFamily: f.css }}>
              {name.trim() || (ar ? "توقيعك" : "Signature")}
            </span>
            <span className="block text-[9px] text-muted-foreground mt-1">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}