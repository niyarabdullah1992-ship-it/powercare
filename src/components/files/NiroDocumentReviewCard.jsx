import React, { useRef, useState } from "react";
import { BrainCircuit, FileText, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import NiroReviewResult from "@/components/files/NiroReviewResult";

export default function NiroDocumentReviewCard({ companyId, ar }) {
  const [file, setFile] = useState(null); const [processing, setProcessing] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(""); const inputRef = useRef(null);
  const imageSelected = file?.type.startsWith("image/");
  const choose = (event) => { const selected = event.target.files?.[0]; if (!selected) return; const valid = selected.type === "application/pdf" || ["image/jpeg", "image/png", "image/webp"].includes(selected.type); if (!valid) return setError(ar ? "اختر ملف PDF أو صورة JPG أو PNG أو WebP صالحة." : "Choose a valid PDF, JPG, PNG, or WebP file."); setFile(selected); setResult(null); setError(""); };
  const review = async () => {
    if (!file) return;
    setProcessing(true); setError(""); setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("niroDocumentReview", { action: "review", companyId, sessionToken: getCompanyToken(companyId), fileName: file.name, docUrl: file_url });
      setResult(response.data);
    } catch (err) { setError((ar ? "تعذّرت معالجة المستند — " : "Document processing failed — ") + (err?.response?.data?.error || err.message)); }
    finally { setProcessing(false); }
  };
  return <div className="space-y-5"><section className="rounded-3xl border border-accent/25 bg-gradient-to-br from-primary to-sidebar p-6 text-primary-foreground shadow-elevated sm:p-8"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10"><BrainCircuit className="h-7 w-7 text-accent" /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">Niro Document Intelligence</p><h2 className="mt-1 font-heading text-3xl font-semibold">{ar ? "تحليل الصور ومراجعة المستندات" : "Image analysis and document review"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/70">{ar ? "يحلل Niro الصور، أو يراجع مستندات PDF ويضع ختم الشركة الرقمي عند اجتياز المراجعة." : "Niro analyzes images, or reviews PDF documents and applies the company digital seal after they pass review."}</p></div></div><button onClick={() => inputRef.current?.click()} className="mt-7 flex min-h-[120px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-foreground/25 bg-primary-foreground/5 p-5 hover:bg-primary-foreground/10"><Upload className="mb-2 h-7 w-7 text-accent" /><span className="text-sm font-bold">{file ? file.name : ar ? "اختر صورة للتحليل أو مستند PDF للمراجعة" : "Choose an image to analyze or a PDF to review"}</span></button><input ref={inputRef} type="file" accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp" className="hidden" onChange={choose} /><button onClick={review} disabled={!file || processing} className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-bold text-accent-foreground shadow-lg disabled:opacity-40">{processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}{processing ? (ar ? "Niro يحلل الملف…" : "Niro is analyzing…") : imageSelected ? (ar ? "تحليل الصورة" : "Analyze image") : (ar ? "تحليل المستند وختمه" : "Analyze and seal document")}</button>{error && <p className="mt-4 rounded-xl bg-destructive/15 px-4 py-3 text-xs text-red-200">{error}</p>}</section><NiroReviewResult result={result} ar={ar} /></div>;
}