import React, { useRef, useState } from "react";
import { formatDate } from "@/lib/dateFormat";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Loader2, Images } from "lucide-react";
import Logo from "@/components/Logo";
import BannerGallery from "@/components/employees/BannerGallery";

// Calm, artistic welcome banner shown right after login — greets the user and
// surfaces the day's most important alerts without feeling noisy.
export default function WelcomeHero({ name, companyName, t, lang, alerts = [], employee, companyId }) {
  const hasAlerts = alerts.some((a) => a.value > 0);
  const photoInput = useRef(null);
  const bannerInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const bannerUrl = employee?.profile?.bannerUrl;

  const changePhoto = async (file) => {
    if (!file || !employee || !companyId) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, employee.id, { avatarUrl: file_url });
    } finally {
      setUploading(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  const changeBanner = async (file) => {
    if (!file || !employee || !companyId) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateEmployeeProfile(companyId, employee.id, { bannerUrl: file_url });
    if (bannerInput.current) bannerInput.current.value = "";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-landing-gold/20 bg-primary p-6 shadow-xl shadow-primary/10 md:p-8">
      {bannerUrl && (
        <>
          <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/70" />
        </>
      )}
      <div className="absolute -top-20 -end-16 w-64 h-64 rounded-full bg-landing-gold/25 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -start-10 w-56 h-56 rounded-full bg-landing-gold-light/20 blur-[80px] pointer-events-none" />
      <img
        src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/d1de0f5de_generated_image.png"
        alt={lang === "ar" ? "موظف مبتسم" : "Smiling employee"}
        className="pointer-events-none absolute bottom-0 end-0 hidden h-full w-56 object-cover object-top opacity-80 md:block"
      />

      {employee && companyId && (
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="absolute end-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-landing-gold/40 bg-black/30 px-2.5 py-1.5 text-xs font-body text-landing-gold-light backdrop-blur-md transition hover:bg-black/50"
          title={lang === "ar" ? "تغيير الغلاف" : "Change banner"}
        >
          <Images className="h-3.5 w-3.5" /> {lang === "ar" ? "الغلاف" : "Banner"}
        </button>
      )}
      <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => changeBanner(e.target.files?.[0])} />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:pe-52">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              disabled={uploading || !employee}
              className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-landing-gold/40 bg-white/10 p-2.5 shadow-lg transition hover:border-landing-gold hover:opacity-90 disabled:cursor-default"
              title={t("uploadPhoto")}
              aria-label={t("uploadPhoto")}
            >
              {employee?.profile?.avatarUrl ? <img src={employee.profile.avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" /> : <Logo size={34} />}
              {uploading && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
            </button>
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => changePhoto(e.target.files?.[0])} />
          </div>
          <div>
            <p className="text-[11px] tracking-widest-xl uppercase text-landing-gold-light/70 font-body mb-1">
              {formatDate(new Date(), lang, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="hero-title text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-landing-gold-light to-landing-gold">
              {t("welcome")}, {name}
            </h2>
            <p className="text-white/40 font-body text-sm mt-1">{companyName}</p>
          </div>
          <img
            src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/d1de0f5de_generated_image.png"
            alt={lang === "ar" ? "موظف مبتسم" : "Smiling employee"}
            className="ms-auto h-20 w-16 shrink-0 rounded-xl border border-landing-gold/30 object-cover object-top shadow-lg md:hidden"
          />
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3 md:pe-52">
        {hasAlerts ? (
          alerts.filter((a) => a.value > 0).map((a) => (
            <div
              key={a.key}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <span className="w-8 h-8 rounded-full bg-landing-gold/15 text-landing-gold-light flex items-center justify-center shrink-0">
                <a.icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="hero-title text-xl text-white leading-none">{a.value}</p>
                <p className="text-[10px] tracking-widest-xl uppercase text-white/40 font-body mt-1">{a.label}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white/50 font-body text-sm">{t("noNotifications")}</p>
        )}
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