import React, { useState } from "react";
import { LayoutDashboard, Grid3X3, Gauge, ClipboardCheck, FileSignature, Building2 } from "lucide-react";
import SafetyOverviewTab from "@/components/safety/SafetyOverviewTab";
import RiskAssessmentTab from "@/components/safety/RiskAssessmentTab";
import SafetyKpiTab from "@/components/safety/SafetyKpiTab";
import SafetyChecklistTab from "@/components/safety/SafetyChecklistTab";
import PermitWorkTab from "@/components/safety/PermitWorkTab";
import { checklistCompliance } from "@/lib/safetyStandards";

export default function StationSafetyCard({ station, rec, canEdit, canApprove, approvalIssues = [], lang, signerName, onUpdate, onCloseHazard, onApprove, onIncident }) {
  const [tab, setTab] = useState("overview");
  const ar = lang === "ar";
  const tabs = [
    ["overview", LayoutDashboard, ar ? "نظرة عامة" : "Overview"],
    ["risks", Grid3X3, ar ? "تقييم المخاطر" : "Risk Matrix"],
    ["kpis", Gauge, "KPIs"],
    ["checklist", ClipboardCheck, ar ? "قوائم التحقق" : "Checklists"],
    ["permits", FileSignature, ar ? "تصاريح العمل" : "Permits"],
  ];
  const shared = { rec: rec || {}, canEdit, lang, onUpdate };

  return (
    <section className="space-y-3 rounded-2xl border-2 border-accent/20 bg-secondary/40 p-3 shadow-sm" dir={ar ? "rtl" : "ltr"}>
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Building2 className="h-4 w-4" /></span>
          <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{ar ? "المحطة" : "Station"}</p><h3 className="truncate text-sm font-semibold">{station.name}</h3></div>
        </div>
        <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">{checklistCompliance(rec?.checklistResults || {})}%</span>
      </header>
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b pb-2">
        {tabs.map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] ${tab === key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            <Icon className="h-3 w-3" />{label}
          </button>
        ))}
      </div>
      {tab === "overview" && <SafetyOverviewTab station={station} {...shared} canApprove={canApprove} approvalIssues={approvalIssues} onCloseHazard={onCloseHazard} onApprove={onApprove} onIncident={onIncident} />}
      {tab === "risks" && <RiskAssessmentTab items={rec?.riskItems || []} canEdit={canEdit} lang={lang} onChange={(riskItems) => onUpdate({ riskItems })} />}
      {tab === "kpis" && <SafetyKpiTab {...shared} />}
      {tab === "checklist" && <SafetyChecklistTab results={rec?.checklistResults || {}} canEdit={canEdit} lang={lang} onChange={(checklistResults) => onUpdate({ checklistResults })} />}
      {tab === "permits" && <PermitWorkTab permits={rec?.permits || []} canEdit={canEdit} lang={lang} signerName={signerName} onChange={(permits) => onUpdate({ permits })} />}
      </div>
    </section>
  );
}