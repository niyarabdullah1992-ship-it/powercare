import React, { useState, useRef } from "react";
import { ShieldCheck, ShieldX, ShieldQuestion, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { sha256HexOfFile } from "@/lib/fileHash";

// Verify a document's authenticity: upload the file → compute SHA-256 locally →
// compare against the signing registry → Valid / Tampered / Not registered.
export default function VerifyDocumentCard({ ar, initialId = "" }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [verId, setVerId] = useState(initialId);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChecking(true);
    setResult(null);
    try {
      const fileHash = await sha256HexOfFile(file);
      const res = await base44.functions.invoke("signedDocs", {
        action: "verify",
        fileHash,
        verificationId: verId.trim() || null,
      });
      setResult({ ...res.data, fileName: file.name });
    } catch {
      setResult({ status: "error" });
    } finally {
      setChecking(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-accent/20 bg-card p-7 text-center shadow-soft sm:p-10">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-accent/25 bg-accent/10"><ShieldCheck className="h-10 w-10 text-accent" /></span>
      <h3 className="font-heading text-3xl font-semibold sm:text-4xl">{ar ? "التحقق من مستند موقّع" : "Verify a signed document"}</h3>
      <p className="text-xs text-muted-foreground font-body">
        {ar
          ? "ارفع الملف الموقّع (PDF) وسنقارن بصمته الرقمية SHA-256 بسجل التوقيعات — أي تعديل على الملف بعد التوقيع سيُكشف فورًا."
          : "Upload the signed PDF and we'll compare its SHA-256 fingerprint against the signing registry — any change after signing is detected instantly."}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={verId}
          onChange={(e) => setVerId(e.target.value)}
          dir="ltr"
          placeholder={ar ? "رقم التحقق (اختياري) PWC-XXXX-XXXX-XXXX" : "Verification ID (optional) PWC-XXXX-XXXX-XXXX"}
          className="min-h-[52px] flex-1 border-0 border-b-2 border-accent/50 bg-transparent px-2 py-3 text-center font-mono text-base tracking-wider focus:border-accent focus:outline-none focus:ring-0"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={checking}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-lg disabled:opacity-40"
        >
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {checking ? (ar ? "جارٍ الفحص…" : "Checking…") : ar ? "رفع الملف للتحقق" : "Upload file to verify"}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>

      {result?.status === "valid" && (
        <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 font-body">
            <ShieldCheck className="w-4 h-4" /> {ar ? "✔ الملف سليم وموثّق" : "✔ Valid — document is authentic"}
          </p>
          <p className="text-xs text-emerald-800 font-body">{ar ? "الموقّع" : "Signer"}: {result.signerName || "—"}</p>
          <p className="text-xs text-emerald-800 font-body" dir="ltr">{ar ? "رقم التحقق" : "Verification ID"}: {result.verificationId}</p>
          <p className="text-xs text-emerald-800 font-body">{ar ? "تاريخ التوقيع" : "Signed at"}: {result.signedAt ? new Date(result.signedAt).toLocaleString(ar ? "ar" : "en") : "—"}</p>
        </div>
      )}
      {result?.status === "tampered" && (
        <div className="p-3.5 rounded-lg border border-red-300 bg-red-50 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-800 font-body">
            <ShieldX className="w-4 h-4" /> {ar ? "✖ الملف مزوّر أو معدّل" : "✖ Tampered — file was modified"}
          </p>
          <p className="text-xs text-red-800 font-body">
            {ar
              ? `رقم التحقق موجود في السجل لكنه لا يطابق هذا الملف — الشارة منقولة من ملف آخر أو الملف عُدّل بعد التوقيع.`
              : `The verification ID exists in the registry but doesn't match this file — the badge was copied from another file or the file was changed after signing.`}
          </p>
        </div>
      )}
      {result?.status === "unknown" && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 font-body">
            <ShieldQuestion className="w-4 h-4" /> {ar ? "غير مسجّل — لم يُوقَّع هذا الملف عبر المنصة أو عُدّل بعد التوقيع" : "Not registered — this file wasn't signed on the platform or was modified after signing"}
          </p>
        </div>
      )}
      {result?.status === "error" && (
        <p className="text-xs text-destructive font-body">{ar ? "تعذّر التحقق — حاول مجددًا." : "Verification failed — try again."}</p>
      )}
    </div>
  );
}