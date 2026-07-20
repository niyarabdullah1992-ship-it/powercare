import React, { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function InvoiceUploader({ value, fileName, onChange, ar }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError(ar ? "الصيغ المدعومة: PDF، JPG، PNG، WEBP." : "Supported formats: PDF, JPG, PNG, WEBP.");
    setError(""); setUploading(true);
    try { const result = await base44.integrations.Core.UploadFile({ file }); onChange(result.file_url, file.name); }
    catch { setError(ar ? "تعذر رفع الفاتورة." : "Invoice upload failed."); }
    finally { setUploading(false); }
  };

  return <div className="space-y-2 md:col-span-2 xl:col-span-4">
    <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={upload} className="hidden" />
    <p className="text-sm font-medium">{ar ? "فاتورة الشراء (اختياري)" : "Purchase invoice (optional)"}</p>
    {!value ? <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-medium text-accent disabled:opacity-50">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}{uploading ? (ar ? "جاري رفع الفاتورة..." : "Uploading invoice...") : (ar ? "رفع الفاتورة" : "Upload invoice")}</button> : <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3"><a href={value} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-medium text-accent hover:underline"><FileText className="h-5 w-5 shrink-0" /><span className="truncate">{fileName || (ar ? "عرض الفاتورة" : "View invoice")}</span></a><button type="button" onClick={() => onChange("", "")} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label={ar ? "حذف الفاتورة" : "Remove invoice"}><Trash2 className="h-4 w-4" /></button></div>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>;
}