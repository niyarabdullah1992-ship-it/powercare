import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Network } from "lucide-react";
import useSmartHierarchyBuilder from "@/hooks/useSmartHierarchyBuilder";
import HierarchyQuickAdd from "@/components/hr/HierarchyQuickAdd";
import HierarchyTemplates from "@/components/hr/HierarchyTemplates";
import HierarchyPeopleBoard from "@/components/hr/HierarchyPeopleBoard";
import HierarchyStationBoard from "@/components/hr/HierarchyStationBoard";

export default function SmartHierarchyBuilder({ data, company, canManage, lang }) {
  const builder = useSmartHierarchyBuilder(data, company.id);
  if (!canManage) return null;
  const ar = lang === "ar";
  return <section className="space-y-4 rounded-xl border border-accent/30 bg-card p-4 shadow-soft">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><Network className="h-5 w-5 text-accent" />{ar ? "منشئ الهيكل الذكي" : "Smart hierarchy builder"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? "اسحب الموظف إلى مدير أو منصب، واسحب المحطة إلى مجموعة؛ يتم تحديث الربط والتصعيد تلقائيًا." : "Drag an employee to a manager or position, and a station to a cluster; reporting and escalation update automatically."}</p></div><HierarchyTemplates onApply={builder.applyTemplate} lang={lang} /></div>
    <HierarchyQuickAdd stations={data.stations} stationId={builder.quickStationId} setStationId={builder.setQuickStationId} onAdd={builder.quickAdd} lang={lang} />
    <DragDropContext onDragEnd={builder.onDragEnd}>
      <HierarchyStationBoard stations={data.stations} clusters={data.hrClusters || []} stationCluster={builder.stationCluster} lang={lang} />
      <HierarchyPeopleBoard people={builder.people} managers={builder.managers} levels={builder.levels} stations={data.stations} onUpdatePosition={builder.updatePosition} onQuickAdd={builder.quickAdd} lang={lang} />
    </DragDropContext>
  </section>;
}