import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { addCertificate, removeCertificate, setCertificateStatus } from "@/lib/store";
import { FileText, Loader2, Plus, X, Award, Check, Paperclip } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

/** Competency codes required by operations assignment gate (CERT_FOR). */
export const COMPETENCY_CODES = [
  { code: "loto", ar: "العزل والوسم LOTO", en: "Lock-out / tag-out" },
  { code: "fa", ar: "الإسعافات الأولية", en: "First aid" },
  { code: "wah", ar: "العمل على ارتفاع", en: "Work at height" },
  { code: "cs", ar: "الأماكن المحصورة", en: "Confined space" },
];

const STATUS_TONE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-destructive/15 text-destructive",
};

function CertGroup({ title, items, canEdit, canApprove, onRemove, onDecide, t, lang }) {
  const ar = lang === "ar";
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-heading font-semibold">
        <Award className="w-4 h-4 text-accent" /> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((c) => {
          const codeMeta = COMPETENCY_CODES.find((x) => x.code === c.code);
          return (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-body hover:underline truncate">
                  <FileText className="w-4 h-4 text-accent shrink-0" /> {c.name}
                </a>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body ${STATUS_TONE[c.status || "pending"]}`}>{t(c.status || "pending")}</span>
                  {c.code && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-body bg-muted text-foreground border border-border">
                      {codeMeta ? (ar ? codeMeta.ar : codeMeta.en) : c.code}
                    </span>
                  )}
                  {c.expiryDate && (
                    <span className="text-[10px] text-muted-foreground font-body" dir="ltr">
                      {ar ? "انتهاء" : "Expires"} {c.expiryDate}
                    </span>
                  )}
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
          );
        })}
      </div>
    </div>
  );
}

export default function CertificatesTab({ employee, companyId, canEdit, canApprove, currentUser }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [code, setCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const certs = employee.certificates || [];

  const submit = async () => {
    if (!name.trim() || !file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const selected = COMPETENCY_CODES.find((c) => c.code === code);
      addCertificate(companyId, employee.id, {
        name: name.trim(),
        category: category.trim() || (selected ? (ar ? selected.ar : selected.en) : ""),
        code: code || null,
        expiryDate: expiryDate || null,
        url: up.file_url,
        fileName: file.name,
        uploadedBy: currentUser?.name,
      });
      setName("");
      setCategory("");
      setCode("");
      setExpiryDate("");
      setFile(null);
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
        <div className="rounded-xl border border-border bg-card p-5">
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
          lang={lang}
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
          lang={lang}
        />
      )}

      {canEdit && (
        <div className="grid grid-cols-1 items-start gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col">
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("certificateName")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body h-9" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-muted-foreground font-body mb-1">{ar ? "كود الكفاءة (بوابة المهام)" : "Competency code (task gate)"}</label>
            <select value={code} onChange={(e) => setCode(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body h-9">
              <option value="">{ar ? "— اختياري / عام —" : "— optional / general —"}</option>
              {COMPETENCY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{ar ? c.ar : c.en}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-muted-foreground font-body mb-1">{ar ? "تاريخ الانتهاء" : "Expiry date"}</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body h-9" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("category")}</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body h-9" />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[t("educationalQualification"), t("technicalQualifications"), t("safetyCertificates")].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-body border ${category === c ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("attachFile")}</label>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-input text-xs font-body h-9 hover:bg-muted"
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{file ? file.name : t("attachFile")}</span>
            </button>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-transparent font-body mb-1 select-none hidden sm:block">.</label>
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim() || !file || uploading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50 h-9"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {t("addCertificate")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
