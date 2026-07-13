import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { updateEmployeeProfile } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import { Pencil, Check, FileText, Loader2, Upload } from "lucide-react";

export default function SalaryTab({ employee, companyId, canEdit }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const profile = employee.profile || {};
  const [form, setForm] = useState({
    baseSalary: profile.baseSalary || "",
    allowances: profile.allowances || "",
    currency: profile.currency || "SAR",
  });

  const save = () => {
    updateEmployeeProfile(companyId, employee.id, form);
    setEditing(false);
  };

  const uploadCertificate = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, employee.id, { salaryCertificateUrl: up.file_url, salaryCertificateName: file.name });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-border bg-card/45 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">{t("salary")}</h3>
          {canEdit && (
            editing ? (
              <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                <Check className="w-3.5 h-3.5" /> {t("save")}
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                <Pencil className="w-3.5 h-3.5" /> {t("edit")}
              </button>
            )
          )}
        </div>
        {!canEdit && !profile.baseSalary ? (
          <p className="text-sm text-muted-foreground font-body">—</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[["baseSalary", "baseSalary"], ["allowances", "allowances"], ["currency", "currency"]].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t(label)}</label>
                {editing ? (
                  <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
                ) : (
                  <p className="text-sm font-body">{profile[key] || "—"}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card/45 p-5 backdrop-blur-xl">
        <h3 className="font-heading font-semibold">{t("salaryCertificate")}</h3>
        {profile.salaryCertificateUrl ? (
          <a href={profile.salaryCertificateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-body hover:underline">
            <FileText className="w-4 h-4 text-accent" /> {profile.salaryCertificateName || t("salaryCertificate")}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground font-body">—</p>
        )}
        {canEdit && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadCertificate(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {t("uploadSalaryCertificate")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}