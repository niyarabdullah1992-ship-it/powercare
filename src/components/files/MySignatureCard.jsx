import React, { useState } from "react";
import { PenLine, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import SignaturePad from "./SignaturePad";

// Each employee's personal signature: drawn once, stored on their profile, and
// reused for signing & emailing documents.
export default function MySignatureCard({ companyId, currentUser, ar }) {
  const signatureUrl = currentUser?.profile?.signatureUrl || "";
  const [editing, setEditing] = useState(!signatureUrl);
  const [saving, setSaving] = useState(false);

  const saveSignature = async (dataUrl) => {
    setSaving(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "signature.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, currentUser.id, { signatureUrl: file_url, signatureUpdatedAt: new Date().toISOString() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-base font-semibold flex items-center gap-2">
        <PenLine className="w-4 h-4 text-accent" /> {ar ? "توقيعي" : "My signature"}
      </h3>
      <p className="text-xs text-muted-foreground font-body">
        {ar ? "ارسم توقيعك مرة واحدة وسيُستخدم عند توقيع وإرسال أي ملف." : "Draw your signature once — it's used whenever you sign and send a document."}
      </p>
      {!editing && signatureUrl ? (
        <div className="flex items-center gap-3">
          <img src={signatureUrl} alt="signature" className="h-20 max-w-[260px] object-contain bg-white rounded-lg border border-border p-2" />
          <div className="flex flex-col gap-1.5">
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              <PenLine className="w-3.5 h-3.5" /> {ar ? "توقيع جديد" : "New signature"}
            </button>
            <button
              onClick={() => { updateEmployeeProfile(companyId, currentUser.id, { signatureUrl: "" }); setEditing(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body text-destructive hover:bg-muted"
            >
              <Trash2 className="w-3.5 h-3.5" /> {ar ? "حذف" : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <SignaturePad ar={ar} onSave={saveSignature} saving={saving} />
      )}
    </div>
  );
}