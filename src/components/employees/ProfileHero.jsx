import React, { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Mail, Building2, Loader2, X, Images } from "lucide-react";
import BannerGallery from "@/components/employees/BannerGallery";
import PresenceDot from "@/components/employees/PresenceDot";
import GradeBadge from "@/components/employees/GradeBadge";

export default function ProfileHero({ employee, companyId, canEdit, roleLabel, grade, stationName }) {
  const { t, lang } = useI18n();
  const [uploading, setUploading] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
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
        className={`relative h-28 bg-secondary bg-cover bg-center ${canEdit ? "cursor-pointer" : ""}`}
        style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
        onClick={() => canEdit && uploading !== "bannerUrl" && bannerInput.current?.click()}
        role={canEdit ? "button" : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={(e) => { if (canEdit && (e.key === "Enter" || e.key === " ")) bannerInput.current?.click(); }}
        aria-label={canEdit ? t("uploadBanner") : undefined}
      >
        {uploading === "bannerUrl" && <span className="absolute inset-0 flex items-center justify-center bg-background/40"><Loader2 className="h-5 w-5 animate-spin" /></span>}
        {canEdit && profile.bannerUrl && <button type="button" onClick={(e) => { e.stopPropagation(); remove("bannerUrl"); }} className="absolute end-3 top-3 rounded-full border border-border bg-background/70 p-1.5 text-foreground backdrop-blur-xl" title={t("removeFile")}><X className="h-3.5 w-3.5" /></button>}
        {canEdit && <button type="button" onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }} className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl" title={lang === "ar" ? "اختيار غلاف جاهز" : "Choose banner"}><Images className="h-3.5 w-3.5" /> {lang === "ar" ? "أغلفة جاهزة" : "Gallery"}</button>}
        <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "bannerUrl")} />
      </div>

      <div className="-mt-12 flex flex-col items-center px-5 pb-7 text-center">
        <div className="relative h-24 w-24 shrink-0">
          <button type="button" onClick={() => canEdit && avatarInput.current?.click()} disabled={!canEdit || uploading === "avatarUrl"} className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-foreground font-heading text-3xl font-medium text-background shadow-xl ring-4 ring-card ${canEdit ? "cursor-pointer transition hover:opacity-90" : "cursor-default"}`} title={canEdit ? t("uploadPhoto") : undefined} aria-label={canEdit ? t("uploadPhoto") : undefined}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : employee.name.charAt(0)}
            {uploading === "avatarUrl" && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
          </button>
          {canEdit && profile.avatarUrl && <button type="button" onClick={() => remove("avatarUrl")} className="absolute -top-1 -end-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md" title={t("removeFile")}><X className="h-3 w-3" /></button>}
          <PresenceDot employee={employee} className="absolute bottom-1 end-1 h-4 w-4 ring-2 ring-card" />
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0], "avatarUrl")} />
        </div>

        <h1 className="mt-4 max-w-full truncate font-heading text-2xl font-semibold">{employee.name}</h1>
        <p className="mt-1 text-sm font-medium text-accent">{roleLabel}</p>
        <GradeBadge grade={grade} className="mt-2" />
        <div className="mt-5 w-full space-y-3 border-t border-border pt-5 text-start text-xs text-muted-foreground">
          {employee.email && <span className="flex items-center gap-2 break-all"><Mail className="h-3.5 w-3.5 shrink-0 text-accent" /> {employee.email}</span>}
          {stationName && <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 shrink-0 text-accent" /> {stationName} · {lang === "ar" ? "حد المحطات" : "Station limit"}: {profile.maxStations || "∞"}</span>}
        </div>
      </div>
      {galleryOpen && (
        <BannerGallery
          onSelect={(url) => updateEmployeeProfile(companyId, employee.id, { bannerUrl: url })}
          onUpload={() => bannerInput.current?.click()}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}