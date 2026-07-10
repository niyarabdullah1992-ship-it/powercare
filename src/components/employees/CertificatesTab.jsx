import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { addCertificate, removeCertificate, setCertificateStatus } from "@/lib/store";
import { FileText, Loader2, Plus, X, Award, Check } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

const STATUS_TONE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-destructive/15 text-destructive",
};

function CertGroup({ title, items, canEdit, canApprove, onRemove, onDecide, t }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="flex items-center gap-2 font-heading font-semibold">
        <Award className="w-4 h-4 text-accent" /> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background">
            <div className="min-w-0 flex-1">
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-body hover:underline truncate">
                <FileText className="w-4 h-4 text-accent shrink-0" /> {c.name}
              </a>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body ${STATUS_TONE[c.status || "pending"]}`}>{t(c.status || "pending")}</span>
                {c.uploadedBy && <span className="text-[10px] text-muted-foreground font-body">{t("uploadedBy")}: {c.uploadedBy}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canApprove && (c.status || "pending") === "pending" && (
                <>
                  <button onClick={() => onDecide(c.id, "approved")} title={t("approveCert")} className="p-1 rounded hover:bg-emerald-50 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDecide(c.id, "rejected")} title={t("rejectCert")} className="p-1 rounded hover:bg-red-50 text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {canEdit && (
                <ConfirmDeleteDialog
                  onConfirm={() => onRemove(c.id)}
                  trigger={
                    <button className="p-1 rounded hover:bg-muted text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CertificatesTab({ employee, companyId, canEdit, canApprove, currentUser }) {
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
      addCertificate(companyId, employee.id, { name: name.trim(), category: category.trim(), url: up.file_url, fileName: file.name, uploadedBy: currentUser?.name });
      setName("");
      setCategory("");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const decide = (id, status) => setCertificateStatus(companyId, employee.id, id, status, currentUser?.name);

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
          canApprove={canApprove}
          onRemove={(id) => removeCertificate(companyId, employee.id, id)}
          onDecide={decide}
          t={t}
        />
      ))}
      {uncategorized.length > 0 && (
        <CertGroup
          title={t("certificates")}
          items={uncategorized}
          canEdit={canEdit}
          canApprove={canApprove}
          onRemove={(id) => removeCertificate(companyId, employee.id, id)}
          onDecide={decide}
          t={t}
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