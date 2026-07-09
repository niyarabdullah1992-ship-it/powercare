import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { addCertificate, removeCertificate } from "@/lib/store";
import { FileText, Loader2, Plus, X, ShieldCheck, Wrench } from "lucide-react";

const CATEGORIES = [
  { key: "safety", label: "safetyCertificates", icon: ShieldCheck },
  { key: "technical", label: "technicalQualifications", icon: Wrench },
];

function CertGroup({ title, icon: Icon, items, canEdit, onRemove }) {
  const { t } = useI18n();
  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="flex items-center gap-2 font-heading font-semibold">
        <Icon className="w-4 h-4 text-accent" /> {t(title)}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noCertificates")}</p>
      ) : (
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
      )}
    </div>
  );
}

export default function CertificatesTab({ employee, companyId, canEdit }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("safety");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const certs = employee.certificates || [];

  const upload = async (file) => {
    if (!name.trim() || !file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      addCertificate(companyId, employee.id, { name: name.trim(), category, url: up.file_url, fileName: file.name });
      setName("");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {CATEGORIES.map(({ key, label, icon }) => (
        <CertGroup
          key={key}
          title={label}
          icon={icon}
          items={certs.filter((c) => (c.category || "safety") === key)}
          canEdit={canEdit}
          onRemove={(id) => removeCertificate(companyId, employee.id, id)}
        />
      ))}

      {canEdit && (
        <div className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("certificateName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("category")}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body">
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
            </select>
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