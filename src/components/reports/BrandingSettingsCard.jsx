import React, { useState, useRef } from "react";
import { Palette, Upload, Loader2, Check, X, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateCompany } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

const PRESETS = ["#b07d3f", "#1d4ed8", "#047857", "#b91c1c", "#7c3aed", "#0e7490", "#334155", "#be185d"];

// Full branding settings: company logo + custom color, applied automatically to
// every printed/PDF report and colored Excel export across the whole app.
export default function BrandingSettingsCard({ companyId, branding, companyName, lang, onClose }) {
  const { t } = useI18n();
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || "");
  const [color, setColor] = useState(branding?.color || "#b07d3f");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    updateCompany(companyId, (d) => {
      d.reportBranding = { logoUrl, color };
    });
    setSaved(true);
    setTimeout(() => onClose?.(), 800);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color }} />
          {t("brandingTitle")}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-md border border-border hover:bg-muted">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-body">
        {t("brandingDesc")}
      </p>

      {/* Logo */}
      <div className="space-y-2">
        <p className="text-xs font-medium font-body uppercase tracking-wider text-muted-foreground">{t("companyLogo")}</p>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-16 h-16 object-contain rounded-lg border border-border bg-background p-1" />
          ) : (
            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-[10px] font-body text-center px-1">
              {t("noLogo")}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {t("uploadLogo")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
          {logoUrl && (
            <button type="button" onClick={() => setLogoUrl("")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive font-body">
              <Trash2 className="w-3.5 h-3.5" /> {t("removeLogo")}
            </button>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <p className="text-xs font-medium font-body uppercase tracking-wider text-muted-foreground">{t("brandColor")}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
          <label className="flex items-center gap-2 text-xs font-body ms-2 cursor-pointer">
            {t("customColor")}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
          </label>
        </div>
      </div>

      {/* Live preview of the report header */}
      <div className="space-y-2">
        <p className="text-xs font-medium font-body uppercase tracking-wider text-muted-foreground">{t("preview")}</p>
        <div className="rounded-lg border bg-white p-4" style={{ borderColor: color }}>
          <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `3px solid ${color}` }}>
            <div>
              <p className="font-semibold text-sm text-gray-800">{t("tasksReportPreview")}</p>
              <p className="text-[10px] text-gray-500">{companyName}</p>
            </div>
            {logoUrl && <img src={logoUrl} alt="" className="w-10 h-10 object-contain" />}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 rounded-md p-2" style={{ background: `${color}0d`, border: `1px solid ${color}33` }}>
                <p className="text-sm font-bold" style={{ color }}>{i * 4}</p>
                <p className="text-[9px] text-gray-500">{t("statLabel")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body"
      >
        <Check className="w-3.5 h-3.5" />
        {saved ? t("brandingSaved") : t("saveBranding")}

      </button>
    </div>
  );
}