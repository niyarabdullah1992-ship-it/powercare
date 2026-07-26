import React from "react";
import { FileText, Loader2, Upload } from "lucide-react";

export default function GroupSignUploadZone({ ar, uploading, inputRef, onUpload }) {
  return <>
    <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="self-sign-upload-zone m-5 flex min-h-[460px] w-[calc(100%-2.5rem)] flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-secondary/25 p-8 text-center hover:border-accent hover:bg-accent/5 disabled:opacity-60">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">{uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}</span>
      <span className="text-base font-bold">{ar ? "ارفع المستند لبدء التوقيع الجماعي" : "Upload a document to start group signing"}</span>
      <span className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{ar ? "سيظهر المستند مباشرة لتوزيع حقول كل موقّع بالسحب والإفلات." : "The document will open directly so you can drag and place fields for every signer."}</span>
      <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"><FileText className="h-4 w-4" />PDF</span>
    </button>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onUpload} />
  </>;
}