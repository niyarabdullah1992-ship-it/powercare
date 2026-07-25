import React, { useRef } from "react";
import { FileUp, X } from "lucide-react";

export default function AssistantImageUpload({ file, onSelect, disabled, ar }) {
  const inputRef = useRef(null);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-50" aria-label={ar ? "رفع ملف للتحليل" : "Upload file for analysis"}>
        <FileUp className="h-4 w-4 text-accent" />
        <span className="hidden sm:inline">{ar ? "رفع ملف" : "Upload file"}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*,.pdf,.csv,.xlsx,.xls,audio/*" className="hidden" onChange={(event) => onSelect(event.target.files?.[0] || null)} />
      {file && <div className="flex min-w-0 items-center gap-1 rounded-md bg-muted px-2 py-1.5 text-xs"><span className="max-w-28 truncate">{file.name}</span><button type="button" onClick={() => onSelect(null)} className="rounded p-0.5 hover:bg-background" aria-label={ar ? "إزالة الصورة" : "Remove image"}><X className="h-3.5 w-3.5" /></button></div>}
    </div>
  );
}