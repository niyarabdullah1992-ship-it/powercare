import React from "react";
import { Building2, GripVertical, Network, ShieldCheck, UserRound } from "lucide-react";
import { levelName } from "@/lib/hrLevels";
import OrgTreeDropZones from "@/components/hr/OrgTreeDropZones";
import useOrgNodeDrag from "@/hooks/useOrgNodeDrag";

export default function HROrgNodeCard({ node, data, dragging, canManage, lang, actions }) {
  const ar = lang === "ar";
  const employee = node.type === "employee" ? data.employees.find((item) => item.id === node.refId) : null;
  const station = node.type === "station" ? data.stations.find((item) => item.id === node.refId) : null;
  const cluster = node.type === "cluster" ? data.hrClusters?.find((item) => item.id === node.refId) : null;
  const level = employee && data.hrLevels?.find((item) => item.id === employee.hrLevelId);
  const label = employee?.name || station?.name || cluster?.name || node.refId;
  const Icon = node.type === "station" ? Building2 : node.type === "cluster" ? Network : UserRound;
  const dark = node.type !== "employee";
  const drag = useOrgNodeDrag(node.id, canManage && node.type === "employee", actions.start, actions.end, actions.drop);
  const assigning = typeof dragging === "string" && dragging.startsWith("unassigned:");
  return <div className="relative mx-auto w-56">
    <button type="button" {...drag.handlers} onClick={(event) => { if (!drag.suppressClick() && employee) actions.edit(employee); }} className={`w-full select-none rounded-lg border p-3 text-start shadow-sm ${canManage && employee ? "cursor-grab active:cursor-grabbing" : ""} ${dark ? "border-accent/50 bg-primary text-primary-foreground" : "border-border bg-card hover:border-accent/60"}`}>
      <span className="flex items-center gap-2.5">{canManage && employee && <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />}<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{label}</b><span className={`block truncate text-[10px] ${dark ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{cluster ? `${cluster.stationIds?.length || 0} ${ar ? "محطات" : "stations"}` : station ? (ar ? "محطة" : "Station") : (employee?.position || employee?.profile?.position || "HR")}</span></span></span>
    </button>
    {employee && <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => actions.edit(employee)} className="mx-auto mt-1 flex max-w-[90%] items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent hover:bg-accent hover:text-accent-foreground"><ShieldCheck className="h-3 w-3" />{levelName(level, lang) || (ar ? "تأكيد الدور المقترح" : "Confirm suggested role")}</button>}
    <OrgTreeDropZones active={dragging && dragging !== node.id} targetId={node.id} onDrop={(mode) => actions.drop(node.id, mode)} ar={ar} insideOnly={assigning} />
  </div>;
}