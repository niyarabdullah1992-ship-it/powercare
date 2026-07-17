import React, { useRef, useState } from "react";
import { FileCheck2, Loader2, Upload } from "lucide-react";
import { stampOnPdf } from "@/lib/multiSignStamp";

export default function SelfSignDocumentCard({ signatureUrl, ar }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError(ar ? "اختر ملف PDF صالحًا." : "Choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setSuccess("");
    setError("");
  };

  const signAndDownload = async () => {
    const sourceUrl = URL.createObjectURL(file);
    setSigning(true);
    setError("");
    try {
      const { bytes } = await stampOnPdf(sourceUrl, signatureUrl, 0, null, null, 1, false);
      const outputName = `${file.name.replace(/\.pdf$/i, "")}-signed.pdf`;
      const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = outputName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setSuccess(outputName);
    } catch {
      setError(ar ? "تعذّر توقيع المستند. حاول مرة أخرى." : "Couldn't sign the document. Try again.");
    } finally {
      URL.revokeObjectURL(sourceUrl);
      setSigning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent/10 p-2.5"><Upload className="h-5 w-5 text-accent" /></span><div><h3 className="font-heading text-lg font-semibold">{ar ? "وقّع مستندًا بنفسك" : "Sign a document yourself"}</h3><p className="mt-1 text-sm text-muted-foreground">{ar ? "أضف توقيعك المحفوظ إلى ملف PDF وحمّله فورًا، دون إرسال طلب." : "Add your saved signature to a PDF and download it instantly, without sending a request."}</p></div></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"><Upload className="h-4 w-4" />{ar ? "اختيار ملف PDF" : "Choose PDF"}</button><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={chooseFile} />{file && <span className="max-w-full truncate text-sm text-muted-foreground">{file.name}</span>}</div>
      {file && <button type="button" onClick={signAndDownload} disabled={signing} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">{signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{signing ? (ar ? "جارٍ التوقيع…" : "Signing…") : (ar ? "توقيع وتحميل" : "Sign & download")}</button>}
      {success && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ar ? `تم توقيع وتحميل ${success}` : `${success} was signed and downloaded.`}</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </section>
  );
}