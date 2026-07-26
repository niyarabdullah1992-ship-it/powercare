import React, { useRef, useState } from "react";
import { Check, ImageUp, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function UploadedSignature({ ar, signerName, stampTheme = "heritage", onSave, saving }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  const choose = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-secondary/35 p-5 text-center hover:border-accent hover:bg-accent/5">
        {preview ? <Image src={preview} alt={ar ? "التوقيع المرفوع" : "Uploaded signature"} fittingType="fit" className="h-28 w-full" /> : <><ImageUp className="mb-3 h-7 w-7 text-accent" /><span className="text-sm font-bold">{ar ? "ارفع صورة توقيعك" : "Upload your signature image"}</span><span className="mt-1 text-xs text-muted-foreground">PNG / JPG</span></>}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" onChange={choose} className="hidden" />
      <button type="button" disabled={!preview || saving} onClick={() => onSave(preview, signerName, "uploaded", stampTheme)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "اعتماد التوقيع" : "Approve signature")}</button>
    </div>
  );
}