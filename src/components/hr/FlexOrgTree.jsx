import React, { useEffect, useMemo, useRef, useState } from "react";
import { Network, Plus } from "lucide-react";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";
import { initializeOrgTree, moveOrgNode, toggleComplaintEscalationMember } from "@/lib/orgTree";
import { sortComplaintChainByTree } from "@/lib/escalation";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import FlexOrgBranch from "@/components/hr/FlexOrgBranch";
import OrgTreeGuide from "@/components/hr/OrgTreeGuide";
import OrgTreeNodeModal from "@/components/hr/OrgTreeNodeModal";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";

export default function FlexOrgTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const [editing, setEditing] = useState(undefined);
  const [dragging, setDragging] = useState(null);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);
  const nodes = data.orgTree || [];
  const roots = useMemo(() => nodes.filter((node) => !node.parentId).sort((a, b) => a.order - b.order), [nodes]);
  const escalationChain = useMemo(() => sortComplaintChainByTree(data.complaintEscalationChain || [], data), [data.complaintEscalationChain, data.orgTree]);
  const canManage = isCompanyOwner(currentUser, data) || canManageEmployees(currentUser) || hasHRPermission(currentUser, data, "manage_employees");
  const gestures = useOrgTreeViewport(viewportRef, zoom, (value) => setZoom(Math.max(.5, Math.min(1.5, value))));
  useEffect(() => initializeOrgTree(company.id, data), [company.id, data.orgTree, data.stations]);
  const actions = { start: setDragging, end: () => setDragging(null), edit: setEditing, toggleEscalation: (employeeId) => toggleComplaintEscalationMember(company.id, employeeId), drop: (targetId, mode) => { const resolvedMode = ar && mode === "left" ? "right" : ar && mode === "right" ? "left" : mode; moveOrgNode(company.id, dragging, targetId, resolvedMode); setDragging(null); } };
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-card shadow-sm" dir={ar ? "rtl" : "ltr"}><header className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-primary px-4 py-4 text-primary-foreground"><div className="flex items-center gap-3"><span className="rounded-lg bg-accent/15 p-2"><Network className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{ar ? "الشجرة التنظيمية المرنة" : "Flexible organization tree"}</h2><p className="text-[11px] text-primary-foreground/70">{ar ? "اسحب أي محطة أو شخص إلى اليمين أو اليسار أو الأعلى أو الأسفل" : "Drag any station or person left, right, above, or below"}</p></div></div><div className="flex items-center gap-2"><HierarchyZoomControls zoom={zoom} onZoom={(change) => setZoom(Math.max(.5, Math.min(1.5, zoom + change)))} onFit={() => setZoom(1)} ar={ar} />{canManage && <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة" : "Add"}</button>}</div></header>
    <OrgTreeGuide ar={ar} />
    <div ref={viewportRef} {...gestures} className="max-h-[760px] cursor-grab overflow-auto p-6 active:cursor-grabbing" style={{ touchAction: "none" }}><div className="mx-auto flex min-w-max origin-top items-start justify-center gap-10" style={{ zoom }}>{roots.length ? roots.map((root) => <FlexOrgBranch key={root.id} node={root} nodes={nodes} data={data} escalationChain={escalationChain} canManage={canManage} dragging={dragging} actions={actions} ar={ar} />) : <div className="py-12 text-center"><Network className="mx-auto h-8 w-8 text-accent" /><p className="mt-3 text-sm font-semibold">{ar ? "ابدأ بإضافة أول عقدة" : "Add the first node to begin"}</p></div>}</div></div>
    {editing !== undefined && <OrgTreeNodeModal initial={editing} data={data} company={company} companyId={company.id} lang={lang} onClose={() => setEditing(undefined)} />}
  </section>;
}