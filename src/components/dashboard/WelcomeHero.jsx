import React, { useRef, useState } from "react";
import { formatDate } from "@/lib/dateFormat";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Camera, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

// Calm, artistic welcome banner shown right after login — greets the user and
// surfaces the day's most important alerts without feeling noisy.
export default function WelcomeHero({ name, companyName, t, lang, alerts = [], employee, companyId }) {
  const hasAlerts = alerts.some((a) => a.value > 0);
  const photoInput = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-landing-gold/20 bg-gradient-to-br from-[#6b4f30] via-[#8a6a45] to-[#5c4429] p-6 md:p-8">
      <div className="absolute -top-20 -end-16 w-64 h-64 rounded-full bg-landing-gold/25 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -start-10 w-56 h-56 rounded-full bg-landing-gold-light/20 blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-landing-gold/40 bg-white/10 p-2.5 shadow-lg">
              {employee?.profile?.avatarUrl ? <img src={employee.profile.avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" /> : <Logo size={34} />}
            </div>
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              disabled={uploading || !employee}
              className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-foreground text-background shadow-md transition hover:bg-foreground/80 disabled:cursor-default"
              title={t("uploadPhoto")}
              aria-label={t("uploadPhoto")}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
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
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3">
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
    </div>
  );
}