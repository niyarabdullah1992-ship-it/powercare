import React, { useState, useRef } from "react";
import { Palette, Upload, Loader2, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { updateCompany } from "@/lib/store";

// Lets the company owner set its own logo + brand color, used automatically in
// printed/PDF reports instead of the PowerCare defaults.
export default function ReportBrandingEditor({ companyId, branding, lang }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || "");
  const [color, setColor] = useState(branding?.color || "#b07d3f");
  const [uploading, setUploading] = useState(false);
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
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
        <Palette className="w-3.5 h-3.5" style={{ color }} />
        {ar ? "هوية التقرير" : "Report branding"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card flex-wrap">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="w-9 h-9 object-contain rounded-md border border-border bg-background" />
        ) : (
          <div className="w-9 h-9 rounded-md border border-dashed border-border" />
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {ar ? "شعار الشركة" : "Company logo"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
        {logoUrl && (
          <button type="button" onClick={() => setLogoUrl("")} className="text-xs text-muted-foreground hover:text-destructive font-body">
            {ar ? "إزالة" : "Remove"}
          </button>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs font-body">
        {ar ? "لون التقرير" : "Report color"}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
      </label>
      <div className="flex items-center gap-1.5 ms-auto">
        <button type="button" onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
          <Check className="w-3.5 h-3.5" /> {ar ? "حفظ" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-md border border-border hover:bg-muted">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}