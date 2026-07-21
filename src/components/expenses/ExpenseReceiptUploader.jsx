import React, { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ExpenseReceiptUploader({ value, fileName, onChange, ar }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return setError(ar ? "الصيغ المدعومة: PDF، JPG، PNG، WEBP." : "Supported formats: PDF, JPG, PNG, WEBP.");
    if (file.size > MAX_SIZE) return setError(ar ? "يجب ألا يتجاوز حجم الملف 10 ميجابايت." : "The file must not exceed 10 MB.");
    setError(""); setUploading(true);
    try { const result = await base44.integrations.Core.UploadFile({ file }); onChange(result.file_url, file.name); }
    catch { setError(ar ? "تعذر رفع الإيصال. حاول مرة أخرى." : "Receipt upload failed. Please try again."); }
    finally { setUploading(false); }
  };
  return <div className="space-y-2 self-end">
    <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={upload} className="hidden" />
    {!value ? <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent/50 px-3 py-2 text-sm disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-accent" />}{uploading ? (ar ? "جارٍ رفع الإيصال..." : "Uploading receipt...") : (ar ? "رفع الإيصال — صورة أو PDF" : "Upload receipt — image or PDF")}</button> : <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2"><a href={value} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm text-accent hover:underline"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{fileName}</span></a><button type="button" onClick={() => onChange("", "")} className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>;
}