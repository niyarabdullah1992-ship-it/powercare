import React, { useEffect, useState } from "react";
import { PenLine, Trash2, Fingerprint, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import SignaturePad from "./SignaturePad";
import TypedSignature from "./TypedSignature";
import RandomSignaturePicker from "./RandomSignaturePicker";
import SelfSignDocumentCard from "./SelfSignDocumentCard";

// DocuSign-style unique signature ID: a non-reversible SHA-256 hash of the
// signer + timestamp, formatted as PWC-XXXX-XXXX-XXXX for verification.
async function generateSignatureId(userId) {
  const data = new TextEncoder().encode(`${userId}::${Date.now()}::${Math.random()}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `PWC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

function dataUrlToBlob(dataUrl) {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Each employee's personal signature: drawn or typed once, stored on their
// profile with a unique encrypted ID, and reused for signing documents.
export default function MySignatureCard({ companyId, currentUser, ar, onSaved }) {
  const [localSignature, setLocalSignature] = useState(null);
  const signatureUrl = localSignature?.signatureUrl ?? currentUser?.profile?.signatureUrl ?? "";
  const signatureRawUrl = localSignature?.signatureRawUrl ?? currentUser?.profile?.signatureRawUrl ?? "";
  const signatureVariant = localSignature?.signatureVariant ?? currentUser?.profile?.signatureVariant ?? "unique";
  const signatureId = localSignature?.signatureId ?? currentUser?.profile?.signatureId ?? "";
  const [editing, setEditing] = useState(!signatureUrl);
  const [mode, setMode] = useState("type"); // "type" | "draw" | "templates"
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [refreshedPreview, setRefreshedPreview] = useState("");
  const [creationPreview, setCreationPreview] = useState("");

  useEffect(() => {
    let active = true;
    setRefreshedPreview("");
    if (!signatureRawUrl || !signatureId || signatureVariant === "composed") return () => { active = false; };
    const signerName = currentUser?.profile?.signatureName || currentUser?.name || "";
    makeSignatureStamp(signatureRawUrl, signerName, signatureId, signatureVariant)
      .then((preview) => { if (active) setRefreshedPreview(preview); })
      .catch(() => { if (active) setRefreshedPreview(""); });
    return () => { active = false; };
  }, [signatureRawUrl, signatureId, signatureVariant, currentUser?.profile?.signatureName, currentUser?.name]);

  const saveSignature = async (dataUrl, typedName, signatureStyle = "composed") => {
    setSaving(true);
    setError("");
    try {
      const sigId = await generateSignatureId(currentUser.id);
      const signerName = typeof typedName === "string" ? typedName : currentUser.name;
      const finalDataUrl = signatureStyle !== "composed"
        ? await makeSignatureStamp(dataUrl, signerName, sigId, signatureStyle)
        : dataUrl;
      const finalFile = new File([dataUrlToBlob(finalDataUrl)], "signature.png", { type: "image/png" });
      const rawFile = signatureStyle !== "composed"
        ? new File([dataUrlToBlob(dataUrl)], "signature-original.png", { type: "image/png" })
        : null;
      const [finalUpload, rawUpload] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: finalFile }),
        rawFile ? base44.integrations.Core.UploadFile({ file: rawFile }) : Promise.resolve(null),
      ]);
      const savedProfile = {
        signatureUrl: finalUpload.file_url,
        signatureRawUrl: rawUpload?.file_url || "",
        signatureVariant: signatureStyle,
        signatureId: sigId,
        signatureName: signerName,
        signatureUpdatedAt: new Date().toISOString(),
      };
      updateEmployeeProfile(companyId, currentUser.id, savedProfile);
      setLocalSignature(savedProfile);
      onSaved?.(savedProfile);
      setEditing(false);
    } catch {
      setError(ar ? "تعذّر حفظ التوقيع؛ حاول مرة أخرى." : "Couldn't save the signature; try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(signatureId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-xl space-y-3">
    <div className="overflow-hidden !rounded-2xl border border-signature-ink/10 bg-signature-organic shadow-soft">
      <div className="px-6 pb-2 pt-7 text-center">
        <h3 className="font-heading text-2xl font-bold text-signature-ink">{ar ? "توقيعي الشخصي" : "My personal signature"}</h3>
      </div>
      <div className="space-y-4 px-6 pb-7 pt-2 sm:px-10">
      {!editing && signatureUrl ? (
        <div className="space-y-3">
          <div className={`w-full bg-white rounded-lg border border-border p-2 flex items-center justify-center ${signatureRawUrl ? "aspect-[3/1] max-w-2xl" : ""}`}>
            <img src={refreshedPreview || signatureUrl} alt="signature" className={signatureRawUrl ? "h-full w-full object-contain" : "h-20 max-w-full object-contain"} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-5 py-2 text-xs font-bold text-foreground hover:bg-secondary whitespace-nowrap">
              <PenLine className="w-3.5 h-3.5" /> {ar ? "توقيع جديد" : "New signature"}
            </button>
            <button
              onClick={() => {
                const cleared = { signatureUrl: "", signatureRawUrl: "", signatureVariant: "", signatureId: "" };
                updateEmployeeProfile(companyId, currentUser.id, cleared);
                setLocalSignature(cleared);
                onSaved?.(cleared);
                setEditing(true);
              }}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-destructive/40 px-5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" /> {ar ? "حذف" : "Delete"}
            </button>
          </div>
          {signatureId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border w-fit">
              <Fingerprint className="w-4 h-4 text-accent shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-body">{ar ? "رقم التحقق المشفّر" : "Encrypted verification ID"}</p>
                <p className="text-xs font-mono font-medium tracking-wider" dir="ltr">{signatureId}</p>
              </div>
              <button onClick={copyId} className="p-1.5 rounded hover:bg-background text-muted-foreground" title={ar ? "نسخ" : "Copy"}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex min-h-52 items-center justify-center overflow-hidden border-2 border-signature-organic bg-signature-ink p-5 text-signature-organic shadow-inner [border-radius:2.25rem_3.5rem_2.5rem_3.25rem/3.25rem_2.25rem_3.5rem_2.5rem]">
            {creationPreview ? <img src={creationPreview} alt={ar ? "معاينة التوقيع" : "Signature preview"} className="max-h-40 w-full object-contain" /> : <div className="text-center"><p className="text-lg font-bold">{ar ? "المعاينة النهائية" : "Final preview"}</p><p className="mt-1 text-sm opacity-80">{ar ? "ستظهر المعاينة هنا." : "Your preview will appear here."}</p></div>}
          </div>
          <p className="mx-auto max-w-sm text-center text-xs leading-5 text-signature-ink">
            {ar ? "اختر طريقة إنشاء التوقيع، راجع المعاينة، ثم اعتمده للحصول على رقم تحقق مشفّر." : "Choose how to create your signature, review the preview, then approve it for an encrypted verification ID."}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setMode("type"); setCreationPreview(""); }} className={`flex h-10 items-center justify-center !rounded-full px-3 text-xs font-bold transition ${mode === "type" ? "bg-signature-ink text-signature-organic shadow-sm" : "border border-signature-ink/40 text-signature-ink"}`}>{ar ? "كتابة الاسم" : "Type name"}</button>
            <button onClick={() => { setMode("draw"); setCreationPreview(""); }} className={`flex h-10 items-center justify-center !rounded-full px-3 text-xs font-bold transition ${mode === "draw" ? "bg-signature-ink text-signature-organic shadow-sm" : "border border-signature-ink/40 text-signature-ink"}`}>{ar ? "رسم التوقيع" : "Draw"}</button>
            <button onClick={() => { setMode("templates"); setCreationPreview(""); }} className={`flex h-10 items-center justify-center !rounded-full px-3 text-xs font-bold transition ${mode === "templates" ? "bg-signature-ink text-signature-organic shadow-sm" : "border border-signature-ink/40 text-signature-ink"}`}>{ar ? "قوالب جاهزة" : "Templates"}</button>
          </div>
          {mode === "type" && <TypedSignature ar={ar} defaultName={currentUser?.name || ""} onPreview={setCreationPreview} onSave={saveSignature} saving={saving} />}
          {mode === "draw" && <SignaturePad ar={ar} onPreview={setCreationPreview} onSave={saveSignature} saving={saving} />}
          {mode === "templates" && <RandomSignaturePicker ar={ar} signerName={currentUser?.name || ""} onPreview={setCreationPreview} onSave={saveSignature} saving={saving} />}
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
        </div>
      )}
      </div>
    </div>
    {signatureUrl && !editing && <SelfSignDocumentCard signatureUrl={signatureUrl} signatureRawUrl={signatureRawUrl} signatureVariant={signatureVariant} currentUser={currentUser} companyId={companyId} ar={ar} />}
    </div>
  );
}