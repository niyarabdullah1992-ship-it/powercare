import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { addCertificate, removeCertificate } from "@/lib/store";
import { FileText, Loader2, Plus, X, Award } from "lucide-react";

function CertGroup({ title, items, canEdit, onRemove }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="flex items-center gap-2 font-heading font-semibold">
        <Award className="w-4 h-4 text-accent" /> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-body hover:underline truncate">
              <FileText className="w-4 h-4 text-accent shrink-0" /> {c.name}
            </a>
            {canEdit && (
              <button onClick={() => onRemove(c.id)} className="p-1 rounded hover:bg-muted text-destructive shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CertificatesTab({ employee, companyId, canEdit }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const certs = employee.certificates || [];

  const upload = async (file) => {
    if (!name.trim() || !file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      addCertificate(companyId, employee.id, { name: name.trim(), category: category.trim(), url: up.file_url, fileName: file.name });
      setName("");
      setCategory("");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const categories = [...new Set(certs.map((c) => c.category?.trim()).filter(Boolean))];
  const uncategorized = certs.filter((c) => !c.category?.trim());

  return (
    <div className="space-y-4">
      {certs.length === 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-sm text-muted-foreground font-body">{t("noCertificates")}</p>
        </div>
      )}
      {categories.map((cat) => (
        <CertGroup
          key={cat}
          title={cat}
          items={certs.filter((c) => c.category?.trim() === cat)}
          canEdit={canEdit}
          onRemove={(id) => removeCertificate(companyId, employee.id, id)}
        />
      ))}
      {uncategorized.length > 0 && (
        <CertGroup
          title={t("certificates")}
          items={uncategorized}
          canEdit={canEdit}
          onRemove={(id) => removeCertificate(companyId, employee.id, id)}
        />
      )}

      {canEdit && (
        <div className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("certificateName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("category")}</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={!name.trim() || uploading} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {t("addCertificate")}
          </button>
        </div>
      )}
    </div>
  );
}