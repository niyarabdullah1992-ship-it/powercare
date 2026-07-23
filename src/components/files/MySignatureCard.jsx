import React, { useState } from "react";
import { PenLine, Trash2, Keyboard, Fingerprint, Copy, Check } from "lucide-react";
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
  const [mode, setMode] = useState("draw"); // "type" | "draw" | "random"
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

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
    <div className="space-y-5">
    <div className="space-y-6 overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-primary to-sidebar p-6 text-primary-foreground shadow-elevated md:p-8">
      <h3 className="flex items-center gap-2 font-heading text-xl font-semibold">
        <PenLine className="h-5 w-5 text-accent" /> {ar ? "توقيعي الشخصي" : "My personal signature"}
      </h3>
      <p className="max-w-2xl text-sm text-primary-foreground/70 font-body">
        {ar
          ? "اكتب اسمك، ارسم توقيعك، أو اختر نموذجًا فريدًا — ويحصل توقيعك على رقم تحقق مشفّر."
          : "Type, draw, or choose a unique generated signature — it gets an encrypted verification ID."}
      </p>
      {!editing && signatureUrl ? (
        <div className="space-y-3">
          <div className="w-full bg-white rounded-lg border border-border p-2 flex items-center justify-center">
            <img src={signatureUrl} alt="signature" className="h-20 max-w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary-foreground/25 px-5 py-2 text-xs font-bold hover:bg-primary-foreground/10 whitespace-nowrap">
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
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-destructive/50 px-5 py-2 text-xs font-bold text-red-300 hover:bg-destructive/15 whitespace-nowrap"
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode("type")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "type" ? "bg-accent text-accent-foreground border-accent" : "border-primary-foreground/20 hover:bg-primary-foreground/10"}`}
            >
              <Keyboard className="w-3.5 h-3.5" /> {ar ? "كتابة الاسم" : "Type name"}
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "draw" ? "bg-accent text-accent-foreground border-accent" : "border-primary-foreground/20 hover:bg-primary-foreground/10"}`}
            >
              <PenLine className="w-3.5 h-3.5" /> {ar ? "رسم التوقيع" : "Draw"}
            </button>
            <button
              onClick={() => setMode("random")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "random" ? "bg-accent text-accent-foreground border-accent" : "border-primary-foreground/20 hover:bg-primary-foreground/10"}`}
            >
              <Fingerprint className="w-3.5 h-3.5" /> {ar ? "توقيع فريد" : "Unique signature"}
            </button>
          </div>
          {mode === "type" ? (
            <TypedSignature ar={ar} defaultName={currentUser?.name || ""} onSave={saveSignature} saving={saving} />
          ) : mode === "random" ? (
            <RandomSignaturePicker ar={ar} signerName={currentUser?.name || ""} onSave={saveSignature} saving={saving} />
          ) : (
            <SignaturePad ar={ar} onSave={saveSignature} saving={saving} />
          )}
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
        </div>
      )}
    </div>
    {signatureUrl && !editing && <SelfSignDocumentCard signatureUrl={signatureUrl} signatureRawUrl={signatureRawUrl} signatureVariant={signatureVariant} currentUser={currentUser} companyId={companyId} ar={ar} />}
    </div>
  );
}