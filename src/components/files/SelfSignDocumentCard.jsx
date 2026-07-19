import React, { useRef, useState } from "react";
import { FileCheck2, Loader2, MousePointerClick, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { signPdfFile } from "@/lib/signPdf";
import { generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";
import MultiSignPlacementModal from "@/components/files/MultiSignPlacementModal";

export default function SelfSignDocumentCard({ signatureUrl, currentUser, companyId, ar }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fields, setFields] = useState([]);
  const [textValues, setTextValues] = useState({});
  const [verificationId, setVerificationId] = useState("");

  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError(ar ? "اختر ملف PDF صالحًا." : "Choose a valid PDF file.");
      return;
    }
    setFile(selected);
    setFields([]);
    setTextValues({});
    setVerificationId(generateVerificationId());
    setSuccess("");
    setError("");
  };

  const signAndDownload = async () => {
    const signatureField = fields.find((field) => field.type === "signature");
    const textFields = fields.filter((field) => field.type === "text");
    if (!signatureField) { setError(ar ? "ضع حقل التوقيع على المستند أولًا." : "Place the signature field on the document first."); return; }
    if (textFields.some((field) => !String(textValues[field.id] || "").trim())) { setError(ar ? "عبّئ جميع حقول النص أولًا." : "Complete all text fields first."); return; }
    const sourceUrl = URL.createObjectURL(file);
    setSigning(true); setError("");
    try {
      const signerName = currentUser?.profile?.signatureName || currentUser?.name || "";
      const qr = await loadBadgeQr(verificationId);
      const { bytes } = await signPdfFile(sourceUrl, signatureUrl, signerName, verificationId, signatureField, qr, (signatureField.scale || 100) / 100, false, fields, textValues);
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
      {file && <><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { setPreviewUrl(URL.createObjectURL(file)); setPlacing(true); }} className="inline-flex items-center gap-2 rounded-lg border border-accent px-5 py-2.5 text-sm font-semibold text-accent"><MousePointerClick className="h-4 w-4" />{fields.length ? (ar ? "تعديل حقول المستند" : "Edit document fields") : (ar ? "وضع حقول التوقيع والنص" : "Place signature and text fields")}</button><button type="button" onClick={signAndDownload} disabled={signing} className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">{signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{signing ? (ar ? "جارٍ إنشاء الملف…" : "Creating document…") : (ar ? "توقيع موثّق وتحميل" : "Verify, sign & download")}</button></div>{fields.filter((field) => field.type === "text").length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.filter((field) => field.type === "text").map((field) => <label key={field.id} className="text-xs font-medium"><span className="mb-1.5 block text-muted-foreground">{field.label || (ar ? "حقل نص" : "Text field")}</span><input value={textValues[field.id] || ""} onChange={(event) => setTextValues((current) => ({ ...current, [field.id]: event.target.value }))} dir="auto" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>)}</div>}</>}
      {success && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ar ? `تم توقيع وتحميل ${success}` : `${success} was signed and downloaded.`}</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {placing && previewUrl && <MultiSignPlacementModal docUrl={previewUrl} signers={[{ name: currentUser?.profile?.signatureName || currentUser?.name || (ar ? "أنا" : "Me"), email: currentUser?.email || "self" }]} initialSpots={{ 0: fields }} ar={ar} onConfirm={(value) => { const nextFields = value[0] || []; setFields(nextFields); setTextValues((current) => Object.fromEntries(nextFields.filter((field) => field.type === "text").map((field) => [field.id, current[field.id] || ""]))); setPlacing(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} onClose={() => { setPlacing(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} />}
    </section>
  );
}