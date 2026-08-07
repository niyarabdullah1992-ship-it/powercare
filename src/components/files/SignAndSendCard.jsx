import React, { useState, useRef } from "react";
import { PenLine, Loader2, MousePointerClick, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { signPdfFile, imageBlobToPdf } from "@/lib/signPdf";
import SignaturePlacementModal from "@/components/files/SignaturePlacementModal";
import { makeVerificationBadgeCanvas, generateVerificationId, loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";
import SignedDocActions from "@/components/files/SignedDocActions";
import PowerCareUploadZone from "@/components/files/PowerCareUploadZone";

// Merges the verification badge (with QR) onto image documents and returns the
// signed PNG blob; PDFs are stamped directly via signPdfFile.
async function signImageFile(docUrl, signerName, sigId, spot, qr, sizeScale = 1) {
  const sc = Math.min(Math.max(Number(sizeScale) || 1, 0.5), 2);
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const doc = await load(docUrl);
  const canvas = document.createElement("canvas");
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(doc, 0, 0);
  const badge = makeVerificationBadgeCanvas(sigId, signerName, qr);
  const bw = Math.min(Math.max(220, doc.width * 0.3) * sc, doc.width - 16);
  const bh = bw * (badge.height / badge.width);
  const bx = spot
    ? Math.min(Math.max((doc.width * spot.x) / 100 - bw / 2, 8), doc.width - bw - 8)
    : doc.width - bw - 24;
  const by = spot
    ? Math.min(Math.max((doc.height * spot.y) / 100 - bh / 2, 8), doc.height - bh - 8)
    : doc.height - bh - 32;
  ctx.drawImage(badge, bx, by, bw, bh);
  return await new Promise((r) => canvas.toBlob(r, "image/png"));
}

// Upload a document, sign it (badge + QR + SHA-256 registration), then
// download it, email it to one or more people, or send it via station chat.
export default function SignAndSendCard({ currentUser, companyId, companyName, ar }) {
  const signatureUrl = currentUser?.profile?.signatureUrl || "";
  // The name inside the badge rectangle — follows the saved signature name.
  const signerName = currentUser?.profile?.signatureName || currentUser?.name || "";
  const [doc, setDoc] = useState(null); // { name, url, isImage, isPdf, sigId }
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [stage, setStage] = useState("");
  const [signed, setSigned] = useState(null); // { url, hash, verificationId, name }
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [manualSpot, setManualSpot] = useState(null);
  const [sigSize, setSigSize] = useState(100); // signature size % (50–200)
  const fileRef = useRef(null);

  // Uploads with automatic retries — the storage service occasionally returns
  // transient "too many simultaneous queries" errors under load.
  const uploadWithRetry = async (file, attempts = 3) => {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await base44.integrations.Core.UploadFile({ file });
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
    throw lastErr;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSigned(null);
    setManualSpot(null);
    setError("");
    try {
      const { file_url } = await uploadWithRetry(file);
      // Fresh verification ID per document — never repeats between signings.
      const sigId = generateVerificationId();
      setDoc({
        name: file.name,
        url: file_url,
        isImage: file.type.startsWith("image/"),
        isPdf: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
        sigId,
        // Prefetch the QR while the user decides — signing won't wait for it.
        qrPromise: loadBadgeQr(sigId).catch(() => null),
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setError(ar ? "تعذّر رفع الملف بسبب ضغط مؤقت على الخادم — حاول مرة أخرى بعد لحظات." : "Upload failed due to temporary server load — please try again in a moment.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const signDocument = async () => {
    setError("");
    setSigning(true);
    try {
      // Instant signing: no AI wait — the badge goes to the bottom corner
      // unless the user picked a spot manually.
      const spot = manualSpot;
      setStage(ar ? "جارٍ ختم المستند بالتوقيع ورمز QR…" : "Stamping the document…");
      const qr = await (doc.qrPromise || null);
      let signedUrl, signedBytes;
      if (doc.isPdf) {
        ({ url: signedUrl, bytes: signedBytes } = await signPdfFile(doc.url, signatureUrl, signerName, doc.sigId, spot, qr, sigSize / 100));
      } else {
        const signedBlob = await signImageFile(doc.url, signerName, doc.sigId, spot, qr, sigSize / 100);
        ({ url: signedUrl, bytes: signedBytes } = await imageBlobToPdf(signedBlob));
      }
      // Fingerprint the FINAL signed file and register it in the verification
      // registry — this is what makes badge reuse / tampering detectable.
      setStage(ar ? "جارٍ تسجيل بصمة الملف…" : "Registering the file fingerprint…");
      const fileHash = await sha256HexOfBuffer(signedBytes);
      await base44.functions.invoke("signedDocs", {
        action: "register",
        verificationId: doc.sigId,
        fileHash,
        signerName,
        signerId: currentUser.id,
        companyId,
        sessionToken: getCompanyToken(companyId),
        fileName: doc.name,
      });
      setSigned({ url: signedUrl, hash: fileHash, verificationId: doc.sigId, name: doc.name });
    } catch (err) {
      console.error("Signing failed:", err);
      setError(
        err?.response?.data?.error === "SIGNATURE_REUSE"
          ? (ar ? "رقم التحقق مستخدم مسبقًا — أعد رفع الملف." : "Verification ID already used — re-upload the file.")
          : (ar ? "تعذّر توقيع المستند — " : "Couldn't sign the document — ") + (err?.message || (ar ? "حاول مجددًا." : "try again."))
      );
    } finally {
      setSigning(false);
      setStage("");
    }
  };

  const canSignDoc = doc && (doc.isPdf || doc.isImage) && signatureUrl && !signing;

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-base font-semibold flex items-center gap-2">
        <PenLine className="w-4 h-4 text-accent" /> {ar ? "توقيع مستند وإرساله" : "Sign & send a document"}
      </h3>
      {!signatureUrl && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 font-body">
          {ar ? "احفظ توقيعك أولًا حتى يُضاف تلقائيًا على المستند." : "Save your signature first so it's applied automatically to the document."}
        </p>
      )}

      {/* Document */}
      <PowerCareUploadZone
        onClick={() => fileRef.current?.click()}
        loading={uploading}
        compact
        title={doc?.name || (ar ? "اختيار مستند للتوقيع والإرسال" : "Choose a document to sign and send")}
        description={ar ? "ارفع المستند ليتم تجهيزه للتوقيع الآمن." : "Upload the document to prepare it for secure signing."}
        formats="PDF / Image"
      />
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} />

      {/* Spot picking + sign — hidden once signed */}
      {doc && !signed && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setPlacing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-accent/60 text-accent text-xs font-body hover:bg-accent/10">
              <MousePointerClick className="w-3.5 h-3.5" />
              {manualSpot ? (ar ? "تغيير مكان التوقيع" : "Change signature spot") : ar ? "تحديد مكان التوقيع يدويًا" : "Pick signature spot manually"}
            </button>
            <span className="text-[11px] text-muted-foreground font-body">
              {manualSpot
                ? (ar ? `تم التحديد — صفحة ${manualSpot.page}` : `Spot set — page ${manualSpot.page}`)
                : ar ? "أو اتركه ليوضع في أسفل الصفحة تلقائيًا" : "or leave it to be placed at the bottom automatically"}
            </span>
          </div>
          <button
            onClick={signDocument}
            disabled={!canSignDoc}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
          >
            {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
            {signing ? (stage || (ar ? "جارٍ التوقيع والتسجيل…" : "Signing & registering…")) : ar ? "توقيع المستند" : "Sign document"}
          </button>

        </>
      )}

      {placing && doc && (
        <SignaturePlacementModal
          doc={doc}
          signatureUrl={signatureUrl}
          sigId={doc.sigId}
          signerName={signerName}
          ar={ar}
          initialScale={sigSize}
          onConfirm={(spot, scale) => { setManualSpot(spot); if (scale) setSigSize(scale); setPlacing(false); }}
          onClose={() => setPlacing(false)}
        />
      )}

      {/* After signing: fingerprint registered → download / email / chat */}
      {signed && (
        <>
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 font-body">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            {ar
              ? "وُقّع المستند وسُجّلت بصمته SHA-256 مع رمز QR — لا يمكن نقل هذا التوقيع إلى ملف آخر."
              : "Document signed and its SHA-256 fingerprint registered with a QR code — this signature can't be reused on another file."}
          </p>
          <SignedDocActions signed={signed} currentUser={currentUser} companyName={companyName} ar={ar} />
        </>
      )}

      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}