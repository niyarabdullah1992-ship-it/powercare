import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, BrainCircuit, Radio, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import StabilityInfoPopover from "@/components/dashboard/StabilityInfoPopover";

export default function CommandCenterHero({ companyName, riskScore, activeStations, breakdown, safety, lang, companyId, canEditWeights }) {
  const ar = lang === "ar";
  const state = riskScore >= 70 ? (ar ? "يحتاج تدخلاً" : "Intervention needed") : riskScore >= 40 ? (ar ? "تحت المراقبة" : "Under observation") : (ar ? "مستقر" : "Stable");
  return (
    <section className="relative overflow-hidden rounded-3xl border border-ops-border bg-ops-surface p-6 text-ops-ink shadow-sm md:p-7">
      <div className="absolute -end-16 -top-20 h-64 w-64 rounded-full bg-ops-gold/15 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[1fr,auto] lg:items-end">
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ops-gold"><Radio className="h-4 w-4 animate-pulse" /> PowerCare Intelligence Live</div>
          <p className="text-sm text-muted-foreground">{companyName}</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold md:text-6xl">{ar ? "مركز القيادة الذكي" : "Intelligent Command Center"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{ar ? "صورة تشغيلية موحدة تتوقع المخاطر، ترتب الأولويات، وتحول البيانات إلى قرارات قابلة للتنفيذ." : "One operational picture that predicts risk, prioritizes attention, and turns data into executable decisions."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-32 rounded-2xl border border-ops-border bg-ops-bg/60 p-4">
            {breakdown && <StabilityInfoPopover breakdown={breakdown} riskScore={riskScore} ar={ar} companyId={companyId} canEditWeights={canEditWeights} />}
            <Activity className="mb-3 h-4 w-4 text-landing-gold" /><p className="text-3xl font-heading">{100 - riskScore}%</p><p className="text-xs text-muted-foreground">{state}</p>
          </div>
          <div className="min-w-32 rounded-2xl border border-ops-border bg-ops-bg/60 p-4"><BrainCircuit className="mb-3 h-4 w-4 text-landing-gold" /><p className="text-3xl font-heading">{activeStations}</p><p className="text-xs text-muted-foreground">{ar ? "محطات مراقبة" : "Stations monitored"}</p></div>
          {safety && (
            <RouterLink to="/app/safety" className="min-w-32 rounded-2xl border border-ops-border bg-ops-bg/60 p-4 transition hover:bg-white/10">
              {safety.criticalStations > 0 || safety.todayIncidents > 0
                ? <ShieldAlert className="mb-3 h-4 w-4 text-red-400" />
                : <ShieldCheck className="mb-3 h-4 w-4 text-emerald-400" />}
              {safety.todayIncidents > 0 ? (
                <><p className="text-3xl font-heading text-red-300">{safety.todayIncidents}</p><p className="text-xs text-muted-foreground">{ar ? "حوادث سلامة اليوم" : "Safety incidents today"}</p></>
              ) : safety.criticalStations > 0 ? (
                <><p className="text-3xl font-heading text-red-300">{safety.criticalStations}</p><p className="text-xs text-muted-foreground">{ar ? "محطات سلامة حرجة" : "Critical safety stations"}</p></>
              ) : safety.openHazards > 0 ? (
                <><p className="text-3xl font-heading">{safety.openHazards}</p><p className="text-xs text-muted-foreground">{ar ? "مخاطر سلامة مفتوحة" : "Open safety hazards"}</p></>
              ) : (
                <><p className="text-3xl font-heading">{ar ? "آمن" : "Safe"}</p><p className="text-xs text-muted-foreground">{ar ? "السلامة (HSE)" : "Safety (HSE)"}</p></>
              )}
            </RouterLink>
          )}
        </div>
      </div>
      <Link to="/app/assistant" className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-landing-gold px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">{ar ? "أصدر أمراً إلى نيرو" : "Command Niro"}<ArrowUpRight className="h-4 w-4" /></Link>
    </section>
  );
}