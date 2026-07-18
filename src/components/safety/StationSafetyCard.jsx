import React, { useState } from "react";
import { LayoutDashboard, Grid3X3, Gauge, ClipboardCheck, FileSignature } from "lucide-react";
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold">{station.name}</h3>
        <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">{checklistCompliance(rec?.checklistResults || {})}%</span>
      </div>
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
  );
}