import React, { useEffect, useState } from "react";
import { PenLine, Trash2, Keyboard, Fingerprint, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import SignaturePad from "./SignaturePad";
import TypedSignature from "./TypedSignature";
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
  const [mode, setMode] = useState("type"); // "type" | "draw"
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [refreshedPreview, setRefreshedPreview] = useState("");

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
    <div className="mx-auto max-w-5xl space-y-5">
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border bg-secondary/40 p-5 sm:p-6">
        <h3 className="flex items-center gap-3 font-heading text-2xl font-semibold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10"><PenLine className="h-5 w-5 text-accent" /></span> {ar ? "توقيعي الشخصي" : "My personal signature"}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground font-body">
          {ar
            ? "اختر طريقة إنشاء التوقيع، راجع المعاينة، ثم اعتمده للحصول على رقم تحقق مشفّر."
            : "Choose how to create your signature, review the preview, then approve it for an encrypted verification ID."}
        </p>
      </div>
      <div className="space-y-6 p-5 sm:p-6">
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/50 p-1.5">
            <button
              onClick={() => setMode("type")}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "type" ? "bg-card text-foreground shadow-sm ring-1 ring-accent/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Keyboard className="w-3.5 h-3.5" /> {ar ? "كتابة الاسم" : "Type name"}
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === "draw" ? "bg-card text-foreground shadow-sm ring-1 ring-accent/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <PenLine className="w-3.5 h-3.5" /> {ar ? "رسم التوقيع" : "Draw"}
            </button>
          </div>
          {mode === "type" ? (
            <TypedSignature ar={ar} defaultName={currentUser?.name || ""} onSave={saveSignature} saving={saving} />
          ) : (
            <SignaturePad ar={ar} onSave={saveSignature} saving={saving} />
          )}
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
        </div>
      )}
      </div>
    </div>
    {signatureUrl && !editing && <SelfSignDocumentCard signatureUrl={signatureUrl} signatureRawUrl={signatureRawUrl} signatureVariant={signatureVariant} currentUser={currentUser} companyId={companyId} ar={ar} />}
    </div>
  );
}