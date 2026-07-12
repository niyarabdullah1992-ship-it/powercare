import React, { useState } from "react";
import { PenLine, Trash2, Keyboard, Fingerprint, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import SignaturePad from "./SignaturePad";
import TypedSignature from "./TypedSignature";

// DocuSign-style unique signature ID: a non-reversible SHA-256 hash of the
// signer + timestamp, formatted as PWC-XXXX-XXXX-XXXX for verification.
async function generateSignatureId(userId) {
  const data = new TextEncoder().encode(`${userId}::${Date.now()}::${Math.random()}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `PWC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Each employee's personal signature: drawn or typed once, stored on their
// profile with a unique encrypted ID, and reused for signing documents.
export default function MySignatureCard({ companyId, currentUser, ar }) {
  const signatureUrl = currentUser?.profile?.signatureUrl || "";
  const signatureId = currentUser?.profile?.signatureId || "";
  const [editing, setEditing] = useState(!signatureUrl);
  const [mode, setMode] = useState("type"); // "type" | "draw"
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveSignature = async (dataUrl, typedName) => {
    setSaving(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const sigId = await generateSignatureId(currentUser.id);
      updateEmployeeProfile(companyId, currentUser.id, {
        signatureUrl: file_url,
        signatureId: sigId,
        // The name shown inside the verification badge — updates whenever
        // the signature is re-saved with a new name.
        signatureName: typedName || currentUser.name,
        signatureUpdatedAt: new Date().toISOString(),
      });
      setEditing(false);
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
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-base font-semibold flex items-center gap-2">
        <PenLine className="w-4 h-4 text-accent" /> {ar ? "توقيعي" : "My signature"}
      </h3>
      <p className="text-xs text-muted-foreground font-body">
        {ar
          ? "اكتب اسمك بالخط الذي يعجبك أو ارسم توقيعك — ويحصل توقيعك على رقم تحقق مشفّر فريد."
          : "Type your name in any script or draw your signature — it gets a unique encrypted verification ID."}
      </p>
      {!editing && signatureUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={signatureUrl} alt="signature" className="h-20 max-w-[260px] object-contain bg-white rounded-lg border border-border p-2" />
            <div className="flex flex-col gap-1.5">
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                <PenLine className="w-3.5 h-3.5" /> {ar ? "توقيع جديد" : "New signature"}
              </button>
              <button
                onClick={() => { updateEmployeeProfile(companyId, currentUser.id, { signatureUrl: "", signatureId: "" }); setEditing(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body text-destructive hover:bg-muted"
              >
                <Trash2 className="w-3.5 h-3.5" /> {ar ? "حذف" : "Delete"}
              </button>
            </div>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "type" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              <Keyboard className="w-3.5 h-3.5" /> {ar ? "كتابة الاسم" : "Type name"}
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "draw" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              <PenLine className="w-3.5 h-3.5" /> {ar ? "رسم التوقيع" : "Draw"}
            </button>
          </div>
          {mode === "type" ? (
            <TypedSignature ar={ar} defaultName={currentUser?.name || ""} onSave={saveSignature} saving={saving} />
          ) : (
            <SignaturePad ar={ar} onSave={saveSignature} saving={saving} />
          )}
        </div>
      )}
    </div>
  );
}