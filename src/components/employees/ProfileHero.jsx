import React, { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Camera, Mail, Building2, Loader2, X } from "lucide-react";

export default function ProfileHero({ employee, companyId, canEdit, roleLabel, stationName }) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(null);
  const avatarInput = useRef(null);
  const bannerInput = useRef(null);
  const profile = employee.profile || {};

  const upload = async (file, field) => {
    if (!file) return;
    setUploading(field);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, employee.id, { [field]: up.file_url });
    } finally {
      setUploading(null);
    }
  };

  const remove = (field) => {
    updateEmployeeProfile(companyId, employee.id, { [field]: null });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        className="h-32 bg-gradient-to-r from-accent/25 via-accent/10 to-transparent bg-cover bg-center"
        style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
      >
        {canEdit && (
          <div className="absolute top-3 end-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => bannerInput.current?.click()}
              disabled={uploading === "bannerUrl"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/50 text-white text-xs font-body hover:bg-black/70 disabled:opacity-60"
            >
              {uploading === "bannerUrl" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />} {t("uploadBanner")}
            </button>
            {profile.bannerUrl && (
              <button
                type="button"
                onClick={() => remove("bannerUrl")}
                className="p-1.5 rounded-md bg-black/50 text-white hover:bg-black/70"
                title={t("removeFile")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "bannerUrl")} />
      </div>
      <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-heading font-medium text-3xl shadow-md ring-4 ring-card overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
            ) : (
              employee.name.charAt(0)
            )}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={uploading === "avatarUrl"}
              className="absolute -bottom-1 -end-1 p-1.5 rounded-full bg-foreground text-background shadow-md hover:bg-accent disabled:opacity-60"
              title={t("uploadPhoto")}
            >
              {uploading === "avatarUrl" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            </button>
          )}
          {canEdit && profile.avatarUrl && (
            <button
              type="button"
              onClick={() => remove("avatarUrl")}
              className="absolute -top-1 -end-1 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md hover:opacity-90"
              title={t("removeFile")}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "avatarUrl")} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold truncate">{employee.name}</h1>
          <p className="text-accent font-body text-sm font-medium">{roleLabel}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
            {employee.email && (
              <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {employee.email}</span>
            )}
            {stationName && (
              <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {stationName}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}