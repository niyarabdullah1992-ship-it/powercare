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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        className="h-28 bg-secondary bg-cover bg-center"
        style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
      >
        {canEdit && (
          <div className="absolute end-3 top-3 flex items-center gap-1.5">
            <button type="button" onClick={() => bannerInput.current?.click()} disabled={uploading === "bannerUrl"} className="flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1.5 text-[10px] font-body text-foreground backdrop-blur-xl disabled:opacity-60">
              {uploading === "bannerUrl" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />} {t("uploadBanner")}
            </button>
            {profile.bannerUrl && <button type="button" onClick={() => remove("bannerUrl")} className="rounded-full border border-border bg-background/70 p-1.5 text-foreground backdrop-blur-xl" title={t("removeFile")}><X className="h-3.5 w-3.5" /></button>}
          </div>
        )}
        <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "bannerUrl")} />
      </div>

      <div className="-mt-12 flex flex-col items-center px-5 pb-7 text-center">
        <div className="relative h-24 w-24 shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-foreground font-heading text-3xl font-medium text-background shadow-xl ring-4 ring-card">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : employee.name.charAt(0)}
          </div>
          {canEdit && <button type="button" onClick={() => avatarInput.current?.click()} disabled={uploading === "avatarUrl"} className="absolute -bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-[10px] font-medium text-accent-foreground shadow-lg transition hover:opacity-90 disabled:opacity-60" title={t("uploadPhoto")}>{uploading === "avatarUrl" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />} {t("uploadPhoto")}</button>}
          {canEdit && profile.avatarUrl && <button type="button" onClick={() => remove("avatarUrl")} className="absolute -top-1 -end-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md" title={t("removeFile")}><X className="h-3 w-3" /></button>}
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "avatarUrl")} />
        </div>

        <h1 className="mt-4 max-w-full truncate font-heading text-2xl font-semibold">{employee.name}</h1>
        <p className="mt-1 text-sm font-medium text-accent">{roleLabel}</p>
        <div className="mt-5 w-full space-y-3 border-t border-border pt-5 text-start text-xs text-muted-foreground">
          {employee.email && <span className="flex items-center gap-2 break-all"><Mail className="h-3.5 w-3.5 shrink-0 text-accent" /> {employee.email}</span>}
          {stationName && <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 shrink-0 text-accent" /> {stationName}</span>}
        </div>
      </div>
    </div>
  );
}