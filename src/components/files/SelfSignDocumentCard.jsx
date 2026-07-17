import React, { useRef, useState } from "react";
import { FileCheck2, Loader2, MousePointerClick, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { signPdfFile } from "@/lib/signPdf";
import { generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";
import SignaturePlacementModal from "@/components/files/SignaturePlacementModal";

export default function SelfSignDocumentCard({ signatureUrl, currentUser, companyId, ar }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [spot, setSpot] = useState(null);
  const [signatureSize, setSignatureSize] = useState(100);
  const [verificationId, setVerificationId] = useState("");

  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError(ar ? "اختر ملف PDF صالحًا." : "Choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setSpot(null);
    setSignatureSize(100);
    setVerificationId(generateVerificationId());
    setSuccess("");
    setError("");
  };

  const signAndDownload = async () => {
    const sourceUrl = URL.createObjectURL(file);
    setSigning(true); setError("");
    try {
      const signerName = currentUser?.profile?.signatureName || currentUser?.name || "";
      const qr = await loadBadgeQr(verificationId);
      const { bytes } = await signPdfFile(sourceUrl, signatureUrl, signerName, verificationId, spot, qr, signatureSize / 100, false);
      const fileHash = await sha256HexOfBuffer(bytes);
      await base44.functions.invoke("signedDocs", { action: "register", verificationId, fileHash, signerName, signerId: currentUser.id, companyId, sessionToken: getCompanyToken(companyId), fileName: file.name });
      const outputName = `${file.name.replace(/\.pdf$/i, "")}-signed.pdf`;
      const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = Object.assign(document.createElement("a"), { href: downloadUrl, download: outputName });
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setSuccess(`${outputName} — ${verificationId}`);
    } catch (err) {
      setError((ar ? "تعذّر توقيع المستند الموثّق — " : "Couldn't verify and sign the document — ") + (err?.message || ""));
    } finally { URL.revokeObjectURL(sourceUrl); setSigning(false); }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent/10 p-2.5"><Upload className="h-5 w-5 text-accent" /></span><div><h3 className="font-heading text-lg font-semibold">{ar ? "وقّع مستندًا بنفسك" : "Sign a document yourself"}</h3><p className="mt-1 text-sm text-muted-foreground">{ar ? "أضف ختم التحقق المشفّر ورمز QR ثم حمّل الملف فورًا دون إرساله." : "Add an encrypted verification stamp and QR code, then download without sending."}</p></div></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"><Upload className="h-4 w-4" />{ar ? "اختيار ملف PDF" : "Choose PDF"}</button><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={chooseFile} />{file && <span className="max-w-full truncate text-sm text-muted-foreground">{file.name}</span>}</div>
      {file && <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { setPreviewUrl(URL.createObjectURL(file)); setPlacing(true); }} className="inline-flex items-center gap-2 rounded-lg border border-accent px-5 py-2.5 text-sm font-semibold text-accent"><MousePointerClick className="h-4 w-4" />{spot ? (ar ? "تغيير موقع التوقيع" : "Change signature position") : (ar ? "تحديد موقع التوقيع" : "Choose signature position")}</button><button type="button" onClick={signAndDownload} disabled={signing} className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">{signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{signing ? (ar ? "جارٍ إنشاء الختم المشفّر…" : "Creating encrypted stamp…") : (ar ? "توقيع موثّق وتحميل" : "Verify, sign & download")}</button></div>}
      {success && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ar ? `تم توقيع وتحميل ${success}` : `${success} was signed and downloaded.`}</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {placing && previewUrl && <SignaturePlacementModal doc={{ url: previewUrl, isPdf: true, sigId: verificationId, name: file.name }} signatureUrl={signatureUrl} sigId={verificationId} signerName={currentUser?.profile?.signatureName || currentUser?.name || ""} ar={ar} initialScale={signatureSize} onConfirm={(value, scale) => { setSpot(value); setSignatureSize(scale || 100); setPlacing(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} onClose={() => { setPlacing(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} />}
    </section>
  );
}