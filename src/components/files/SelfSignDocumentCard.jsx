import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, FileCheck2, FileUp, Loader2, MousePointerClick, PenLine, ScanLine, Type, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { imageBlobToPdf, signPdfFile } from "@/lib/signPdf";
import { generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";
import MultiSignPlacementModal from "@/components/files/MultiSignPlacementModal";
import DocumentFirstPagePreview from "@/components/files/DocumentFirstPagePreview";
import { makeSignatureStamp } from "@/lib/multiSignStamp";

const MAX_SIZE = 25 * 1024 * 1024;
const isPdfFile = (file) => file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");

export default function SelfSignDocumentCard({ signatureUrl, signatureRawUrl, signatureVariant, currentUser, companyId, ar, onVerified }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null); const [fileUrl, setFileUrl] = useState(""); const [sourceUrl, setSourceUrl] = useState("");
  const [scanning, setScanning] = useState(false); const [signing, setSigning] = useState(false); const [success, setSuccess] = useState(""); const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false); const [fields, setFields] = useState([]); const [textValues, setTextValues] = useState({}); const [verificationId, setVerificationId] = useState(""); const [stampPreview, setStampPreview] = useState("");

  useEffect(() => {
    let active = true;
    if (!signatureUrl || !verificationId) { setStampPreview(""); return () => { active = false; }; }
    const signerName = currentUser?.profile?.signatureName || currentUser?.name || "";
    const build = signatureRawUrl ? makeSignatureStamp(signatureRawUrl, signerName, verificationId, signatureVariant) : Promise.resolve(signatureUrl);
    build.then((preview) => { if (active) setStampPreview(preview); }).catch(() => { if (active) setStampPreview(signatureUrl); });
    return () => { active = false; };
  }, [signatureUrl, signatureRawUrl, signatureVariant, verificationId, currentUser?.profile?.signatureName, currentUser?.name]);

  const chooseFile = async (event) => {
    const selected = event.target.files?.[0]; if (!selected) return;
    const allowed = isPdfFile(selected) || selected.type === "image/png" || selected.name.toLowerCase().endsWith(".docx");
    if (!allowed || selected.size > MAX_SIZE) { setError(ar ? "اختر PDF أو DOCX أو PNG بحجم لا يتجاوز 25MB." : "Choose a PDF, DOCX, or PNG up to 25MB."); return; }
    setScanning(true); setError(""); setSuccess(""); setFields([]); setTextValues({});
    const localUrl = URL.createObjectURL(selected); setFile(selected); setFileUrl(localUrl); setVerificationId(generateVerificationId());
    if (selected.type === "image/png") { try { const converted = await imageBlobToPdf(selected); setSourceUrl(converted.url); } catch { setError(ar ? "تعذّر تجهيز صورة المستند." : "Couldn't prepare the document image."); } } else setSourceUrl(isPdfFile(selected) ? localUrl : "");
    setTimeout(() => setScanning(false), 650);
  };

  const openPlacement = (kind) => {
    if (!sourceUrl) return;
    let next = fields;
    if (kind) { const id = `${kind}-${Date.now()}`; const y = 78 + fields.length * 5; const field = kind === "signature" ? { id, type: "signature", page: 1, x: 72, y, scale: 55 } : { id, type: "text", label: kind === "date" ? (ar ? "التاريخ" : "Date") : (ar ? "الأحرف الأولى" : "Initials"), page: 1, x: 72, y, scale: 100 }; next = [...fields, field]; setFields(next); if (kind !== "signature") { const name = currentUser?.profile?.signatureName || currentUser?.name || ""; const value = kind === "date" ? new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB") : name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase(); setTextValues((current) => ({ ...current, [id]: value })); } }
    setPlacing(true);
  };

  const signAndDownload = async () => {
    const signatureField = fields.find((field) => field.type === "signature"); if (!signatureUrl) { setError(ar ? "أنشئ توقيعك أولًا." : "Create your signature first."); return; } if (!signatureField) { setError(ar ? "ضع التوقيع على المستند أولًا." : "Place the signature on the document first."); return; }
    setSigning(true); setError(""); setSuccess(""); const id = generateVerificationId(); setVerificationId(id);
    try { const signerName = currentUser?.profile?.signatureName || currentUser?.name || ""; const qr = await loadBadgeQr(id); const { bytes } = await signPdfFile(sourceUrl, signatureRawUrl || null, signerName, id, signatureField, qr, (signatureField.scale || 100) / 100, false, fields, textValues, signatureVariant); const fileHash = await sha256HexOfBuffer(bytes); await base44.functions.invoke("signedDocs", { action: "register", verificationId: id, fileHash, signerName, signerId: currentUser.id, companyId, sessionToken: getCompanyToken(companyId), fileName: file.name }); const outputName = `${file.name.replace(/\.(pdf|png)$/i, "")}-signed.pdf`; const downloadUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const link = Object.assign(document.createElement("a"), { href: downloadUrl, download: outputName }); document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000); const timestamp = new Date().toISOString(); setSuccess(outputName); onVerified?.({ signatureId: id, timestamp, verified: true }); } catch (err) { setError((ar ? "تعذّر توقيع المستند — " : "Couldn't sign the document — ") + (err?.message || "")); } finally { setSigning(false); }
  };

  return <section className="self-sign-document-card w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-soft">
    <div className="self-sign-document-header flex items-start justify-between gap-4 border-b border-border p-5"><div className="flex gap-3"><span className="rounded-xl bg-accent/10 p-2.5"><FileUp className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{ar ? "المستند" : "Document"}</h2><p className="mt-1 text-xs text-muted-foreground">PDF / DOCX / PNG · 25MB</p></div></div>{file && <span className="max-w-48 truncate rounded-full bg-secondary px-3 py-1 text-[11px] font-medium">{file.name}</span>}</div>
    {!file ? <button type="button" onClick={() => inputRef.current?.click()} className="self-sign-upload-zone m-5 flex min-h-[460px] w-[calc(100%-2.5rem)] flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-secondary/25 p-8 text-center hover:border-accent hover:bg-accent/5"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Upload className="h-7 w-7" /></span><span className="text-base font-bold">{ar ? "ارفع المستند لبدء التوقيع" : "Upload a document to start signing"}</span><span className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{ar ? "سيتم فحص الملف أمنيًا ثم عرض الصفحة الأولى مباشرة." : "The file will be security-scanned, then its first page will appear here."}</span></button> : <><div className="self-sign-document-preview relative border-b border-border"><DocumentFirstPagePreview url={fileUrl} file={file} ar={ar} />{scanning && <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/85"><ScanLine className="mb-3 h-7 w-7 animate-pulse text-accent" /><p className="text-sm font-bold">{ar ? "جارٍ فحص أمان المستند…" : "Scanning document security…"}</p></div>}</div><div className="self-sign-actions space-y-4 p-5"><div className="flex flex-wrap gap-2"><button type="button" disabled={!sourceUrl} onClick={() => openPlacement("signature")} className="flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/5 px-3 py-2 text-xs font-bold text-accent disabled:opacity-40"><PenLine className="h-4 w-4" />{ar ? "إضافة توقيع" : "Add signature"}</button><button type="button" disabled={!sourceUrl} onClick={() => openPlacement("date")} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40"><CalendarDays className="h-4 w-4 text-accent" />{ar ? "إضافة التاريخ" : "Add date"}</button><button type="button" disabled={!sourceUrl} onClick={() => openPlacement("initials")} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40"><Type className="h-4 w-4 text-accent" />{ar ? "الأحرف الأولى" : "Initials"}</button>{fields.length > 0 && <button type="button" onClick={() => openPlacement()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold"><MousePointerClick className="h-4 w-4 text-accent" />{ar ? "تعديل المواضع" : "Edit positions"}</button>}</div>{!sourceUrl && <p className="text-xs text-muted-foreground">{ar ? "تم رفع ملف DOCX وحمايته؛ حوّله إلى PDF لإضافة الحقول والتوقيع." : "DOCX uploaded and protected; convert it to PDF to place fields and sign."}</p>}<button type="button" onClick={signAndDownload} disabled={signing || !sourceUrl || scanning} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-40">{signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{signing ? (ar ? "جارٍ التشفير والتوقيع…" : "Encrypting and signing…") : (ar ? "توقيع وإرسال" : "Sign and send")}</button>{success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{ar ? `تم إنشاء ${success}` : `${success} created successfully`}</p>}{error && <p className="text-sm text-destructive">{error}</p>}</div></>}
    <input ref={inputRef} type="file" accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png" onChange={chooseFile} className="hidden" />
    {placing && sourceUrl && <MultiSignPlacementModal docUrl={sourceUrl} signers={[{ name: currentUser?.profile?.signatureName || currentUser?.name || (ar ? "أنا" : "Me"), email: currentUser?.email || "self" }]} initialSpots={{ 0: fields }} signaturePreviews={[stampPreview]} ar={ar} onConfirm={(value) => { const next = value[0] || []; setFields(next); setTextValues((current) => Object.fromEntries(next.filter((field) => field.type === "text").map((field) => [field.id, current[field.id] || ""]))); setPlacing(false); }} onClose={() => setPlacing(false)} />}
  </section>;
}