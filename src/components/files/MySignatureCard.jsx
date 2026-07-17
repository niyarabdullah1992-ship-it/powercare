import React, { useState } from "react";
import { PenLine, Trash2, Keyboard, Fingerprint, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
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
  const signatureId = localSignature?.signatureId ?? currentUser?.profile?.signatureId ?? "";
  const [editing, setEditing] = useState(!signatureUrl);
  const [mode, setMode] = useState("draw"); // "type" | "draw"
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const saveSignature = async (dataUrl, typedName) => {
    setSaving(true);
    setError("");
    try {
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], "signature.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const sigId = await generateSignatureId(currentUser.id);
      const savedProfile = {
        signatureUrl: file_url,
        signatureId: sigId,
        signatureName: typedName || currentUser.name,
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
    <div className="space-y-5 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-xl md:p-7">
      <h3 className="flex items-center gap-2 font-heading text-xl font-semibold">
        <PenLine className="h-5 w-5 text-accent" /> {ar ? "توقيعي الشخصي" : "My personal signature"}
      </h3>
      <p className="max-w-2xl text-sm text-primary-foreground/70 font-body">
        {ar
          ? "اكتب اسمك بالخط الذي يعجبك أو ارسم توقيعك — ويحصل توقيعك على رقم تحقق مشفّر فريد."
          : "Type your name in any script or draw your signature — it gets a unique encrypted verification ID."}
      </p>
      {!editing && signatureUrl ? (
        <div className="space-y-3">
          <div className="w-full bg-white rounded-lg border border-border p-2 flex items-center justify-center">
            <img src={signatureUrl} alt="signature" className="h-20 max-w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted whitespace-nowrap">
              <PenLine className="w-3.5 h-3.5" /> {ar ? "توقيع جديد" : "New signature"}
            </button>
            <button
              onClick={() => {
                const cleared = { signatureUrl: "", signatureId: "" };
                updateEmployeeProfile(companyId, currentUser.id, cleared);
                setLocalSignature(cleared);
                onSaved?.(cleared);
                setEditing(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body text-destructive hover:bg-muted whitespace-nowrap"
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
    {signatureUrl && !editing && <SelfSignDocumentCard signatureUrl={signatureUrl} currentUser={currentUser} companyId={companyId} ar={ar} />}
    </div>
  );
}