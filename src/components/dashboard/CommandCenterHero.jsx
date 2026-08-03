import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, BrainCircuit, Radio, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import StabilityInfoPopover from "@/components/dashboard/StabilityInfoPopover";
import StabilityWave from "@/components/dashboard/StabilityWave";

export default function CommandCenterHero({ companyName, riskScore, activeStations, breakdown, safety, lang, companyId, canEditWeights }) {
  const ar = lang === "ar";
  const state = riskScore >= 70 ? (ar ? "يحتاج تدخلاً" : "Intervention needed") : riskScore >= 40 ? (ar ? "تحت المراقبة" : "Under observation") : (ar ? "مستقر" : "Stable");
  const pulseDuration = `${Math.max(0.45, 1.8 - riskScore * 0.0135).toFixed(2)}s`;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-xl md:p-5">
      <div className="absolute -end-16 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-[1fr,auto] lg:items-end">
        <div>
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><Radio className="h-4 w-4 animate-pulse" /> NiroVera Intelligence Live</div>
          <p className="text-sm text-white/55">{companyName}</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold !text-primary-foreground drop-shadow-sm md:text-4xl">{ar ? "مركز القيادة الذكي" : "Intelligent Command Center"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{ar ? "صورة تشغيلية موحدة تتوقع المخاطر، ترتب الأولويات، وتحول البيانات إلى قرارات قابلة للتنفيذ." : "One operational picture that predicts risk, prioritizes attention, and turns data into executable decisions."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
        <div className={`relative min-w-32 overflow-hidden rounded-2xl border bg-white/5 p-4 ${riskScore < 40 ? "border-accent/40" : "border-white/10"}`}>
          <StabilityWave pulseDuration={pulseDuration} />
          <span className="absolute left-1/2 top-3 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-accent"><span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" style={{ animationDuration: pulseDuration }} /></span>
          {breakdown && <StabilityInfoPopover breakdown={breakdown} riskScore={riskScore} ar={ar} companyId={companyId} canEditWeights={canEditWeights} />}
          <div className="relative z-10"><Activity className="mb-3 h-4 w-4 animate-pulse text-accent" style={{ animationDuration: pulseDuration }} /><p className={`text-3xl font-heading ${riskScore < 40 ? "text-accent" : ""}`}>{100 - riskScore}%</p><p className="text-xs font-semibold text-primary-foreground/90">{state}</p></div>
        </div>
          <div className="min-w-32 rounded-2xl border border-white/10 bg-white/5 p-4"><BrainCircuit className="mb-3 h-4 w-4 text-accent" /><p className="text-3xl font-heading">{activeStations}</p><p className="text-xs text-white/50">{ar ? "محطات مراقبة" : "Stations monitored"}</p></div>
          {safety && (
            <RouterLink to="/app/safety" className="min-w-32 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              {safety.criticalStations > 0 || safety.todayIncidents > 0
                ? <ShieldAlert className="mb-3 h-4 w-4 text-red-400" />
                : <ShieldCheck className="mb-3 h-4 w-4 text-emerald-400" />}
              {safety.todayIncidents > 0 ? (
                <><p className="text-3xl font-heading text-red-300">{safety.todayIncidents}</p><p className="text-xs text-white/50">{ar ? "حوادث سلامة اليوم" : "Safety incidents today"}</p></>
              ) : safety.criticalStations > 0 ? (
                <><p className="text-3xl font-heading text-red-300">{safety.criticalStations}</p><p className="text-xs text-white/50">{ar ? "محطات سلامة حرجة" : "Critical safety stations"}</p></>
              ) : safety.openHazards > 0 ? (
                <><p className="text-3xl font-heading">{safety.openHazards}</p><p className="text-xs text-white/50">{ar ? "مخاطر سلامة مفتوحة" : "Open safety hazards"}</p></>
              ) : (
                <><p className="text-3xl font-heading">{ar ? "آمن" : "Safe"}</p><p className="text-xs text-white/50">{ar ? "السلامة (HSE)" : "Safety (HSE)"}</p></>
              )}
            </RouterLink>
          )}
        </div>
      </div>
      <Link to="/app/assistant" className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90">{ar ? "أصدر أمراً إلى نيرو" : "Command Niro"}<ArrowUpRight className="h-4 w-4" /></Link>
    </section>
  );
}