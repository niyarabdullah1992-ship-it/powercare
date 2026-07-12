import React, { useState, useRef } from "react";
import { Send, Upload, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { signPdfFile, imageBlobToPdf } from "@/lib/signPdf";

// Merges the signature onto image documents (bottom-right corner with name & date)
// and returns the signed PNG blob; PDFs are stamped directly via signPdfFile.
async function signImageFile(docUrl, sigUrl, signerName, sigId) {
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const [doc, sig] = await Promise.all([load(docUrl), load(sigUrl)]);
  const canvas = document.createElement("canvas");
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(doc, 0, 0);
  const sw = Math.max(120, doc.width * 0.22);
  const sh = sw * (sig.height / sig.width);
  ctx.drawImage(sig, doc.width - sw - 24, doc.height - sh - 48);
  ctx.fillStyle = "#1e293b";
  ctx.font = `${Math.max(12, doc.width * 0.018)}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(`${signerName} — ${new Date().toLocaleDateString()}`, doc.width - 24, doc.height - 20);
  if (sigId) {
    ctx.font = `${Math.max(10, doc.width * 0.014)}px monospace`;
    ctx.fillText(`ID: ${sigId}`, doc.width - 24, doc.height - 4);
  }
  return await new Promise((r) => canvas.toBlob(r, "image/png"));
}

// Upload a document, sign it with your saved signature, and email it to anyone.
export default function SignAndSendCard({ currentUser, companyName, ar }) {
  const signatureUrl = currentUser?.profile?.signatureUrl || "";
  const signatureId = currentUser?.profile?.signatureId || "";
  const [doc, setDoc] = useState(null); // { name, url, isImage }
  const [uploading, setUploading] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSent(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDoc({
        name: file.name,
        url: file_url,
        isImage: file.type.startsWith("image/"),
        isPdf: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
      });
      if (!subject) setSubject(ar ? `مستند موقّع: ${file.name}` : `Signed document: ${file.name}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const send = async () => {
    setError("");
    setSending(true);
    try {
      let signedUrl = doc.url;
      if (signatureUrl) {
        try {
          if (doc.isPdf) {
            // Stamp the signature directly onto the last page of the PDF itself.
            signedUrl = await signPdfFile(doc.url, signatureUrl, currentUser.name, signatureId);
          } else if (doc.isImage) {
            // Sign the image, then wrap it into a PDF so the sent file is a PDF.
            const signedBlob = await signImageFile(doc.url, signatureUrl, currentUser.name, signatureId);
            signedUrl = await imageBlobToPdf(signedBlob);
          }
        } catch { /* fall back to original */ }
      }
      const date = new Date().toLocaleString(ar ? "ar" : "en");
      const body = [
        message,
        "",
        "----------------------------------------",
        ar ? `المستند: ${doc.name}` : `Document: ${doc.name}`,
        ar ? `رابط التنزيل: ${signedUrl}` : `Download link: ${signedUrl}`,
        ...(signatureUrl && signedUrl === doc.url ? [ar ? `التوقيع: ${signatureUrl}` : `Signature: ${signatureUrl}`] : []),
        "",
        ar ? `وقّعه: ${currentUser.name}${currentUser.position ? ` — ${currentUser.position}` : ""}` : `Signed by: ${currentUser.name}${currentUser.position ? ` — ${currentUser.position}` : ""}`,
        ar ? `التاريخ: ${date}` : `Date: ${date}`,
        ...(signatureId ? [ar ? `رقم التحقق المشفّر: ${signatureId}` : `Encrypted verification ID: ${signatureId}`] : []),
        companyName ? (ar ? `الشركة: ${companyName}` : `Company: ${companyName}`) : "",
      ].join("\n");
      await base44.integrations.Core.SendEmail({ from_name: companyName || "PowerCare", to: to.trim(), subject: subject.trim(), body });
      setSent(true);
      setDoc(null);
      setTo(""); setSubject(""); setMessage("");
    } catch {
      setError(ar ? "تعذّر الإرسال — تحقق من البريد وحاول مجددًا." : "Sending failed — check the email and try again.");
    } finally {
      setSending(false);
    }
  };

  const canSend = doc && /\S+@\S+\.\S+/.test(to) && subject.trim() && !sending;

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-base font-semibold flex items-center gap-2">
        <Send className="w-4 h-4 text-accent" /> {ar ? "توقيع ملف وإرساله بالبريد" : "Sign & email a document"}
      </h3>
      {!signatureUrl && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 font-body">
          {ar ? "احفظ توقيعك أولًا حتى يُضاف تلقائيًا على المستند." : "Save your signature first so it's applied automatically to the document."}
        </p>
      )}
      {sent && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 font-body">
          <CheckCircle2 className="w-3.5 h-3.5" /> {ar ? "تم إرسال المستند الموقّع بنجاح." : "Signed document sent successfully."}
        </p>
      )}
      {/* Document */}
      <div className="flex items-center gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {ar ? "اختيار ملف" : "Choose file"}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        {doc && (
          <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground truncate">
            <FileText className="w-3.5 h-3.5 shrink-0" /> {doc.name}
            {(doc.isImage || doc.isPdf) && signatureUrl && <span className="text-emerald-600">({ar ? "سيُوقَّع داخل PDF" : "signed as PDF"})</span>}
          </span>
        )}
      </div>
      {/* Email fields */}
      <input
        type="email" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)}
        placeholder={ar ? "بريد المستلم (أي شخص)" : "Recipient email (anyone)"}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        value={subject} onChange={(e) => setSubject(e.target.value)} dir="auto"
        placeholder={ar ? "الموضوع" : "Subject"}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <textarea
        value={message} onChange={(e) => setMessage(e.target.value)} rows={3} dir="auto"
        placeholder={ar ? "رسالة اختيارية…" : "Optional message…"}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
      <button onClick={send} disabled={!canSend} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40">
        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? "توقيع وإرسال" : "Sign & send"}
      </button>
    </div>
  );
}