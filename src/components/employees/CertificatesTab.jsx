import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { addCertificate, removeCertificate } from "@/lib/store";
import { FileText, Loader2, Plus, X } from "lucide-react";

export default function CertificatesTab({ employee, companyId, canEdit }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const certs = employee.certificates || [];

  const upload = async (file) => {
    if (!name.trim() || !file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      addCertificate(companyId, employee.id, { name: name.trim(), url: up.file_url, fileName: file.name });
      setName("");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <h3 className="font-heading font-semibold">{t("certificates")}</h3>

      {certs.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noCertificates")}</p>
      ) : (
        <div className="space-y-2">
          {certs.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-background">
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-body hover:underline truncate">
                <FileText className="w-4 h-4 text-accent shrink-0" /> {c.name}
              </a>
              {canEdit && (
                <button onClick={() => removeCertificate(companyId, employee.id, c.id)} className="p-1 rounded hover:bg-muted text-destructive shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-border">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("certificateName")} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={!name.trim() || uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-50">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {t("addCertificate")}
          </button>
        </div>
      )}
    </div>
  );
}