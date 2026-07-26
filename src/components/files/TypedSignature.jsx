import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import { createTypedSignatureWithDate } from "@/lib/typedSignatureImage";

export default function TypedSignature({ ar, defaultName = "", verificationId, onPreview, onSave, saving }) {
  const [name, setName] = useState(defaultName);
  const [datedSignature, setDatedSignature] = useState("");
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    let active = true;
    setDatedSignature(""); setStamp(""); onPreview?.("");
    if (!name.trim()) return () => { active = false; };
    const date = new Date().toLocaleDateString("en-GB");
    const fontFamily = ar ? "'Aref Ruqaa'" : "'Great Vibes'";
    createTypedSignatureWithDate(name.trim(), date, fontFamily)
      .then((rawSignature) => {
        if (!active) return null;
        setDatedSignature(rawSignature);
        return makeSignatureStamp(rawSignature, name.trim(), verificationId, "typed");
      })
      .then((composed) => { if (active && composed) { setStamp(composed); onPreview?.(composed); } });
    return () => { active = false; };
  }, [name, ar, verificationId, onPreview]);

  const save = () => onSave(datedSignature, name.trim(), "typed");

  return (
    <div className="space-y-5">
      <div><label className="mb-2 block text-xs font-medium text-muted-foreground">{ar ? "اسم التوقيع" : "Signature name"}</label><input value={name} onChange={(event) => setName(event.target.value)} dir="auto" placeholder={ar ? "اكتب اسمك…" : "Type your name…"} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-body outline-none focus:ring-2 focus:ring-ring" /></div>
      {stamp && <div><p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المعاينة النهائية داخل الملف" : "Final in-document preview"}</p><Image src={stamp} alt={ar ? "معاينة الختم" : "Stamp preview"} fittingType="fit" className="mx-auto h-24 w-full max-w-sm" /></div>}
      <button type="button" disabled={!stamp || saving} onClick={save} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-40"><Check className="h-4 w-4" />{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "اعتماد وإرسال التوقيع" : "Approve and submit signature"}</button>
    </div>
  );
}