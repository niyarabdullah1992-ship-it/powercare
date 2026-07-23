import React, { useEffect, useMemo, useRef, useState } from "react";
import { Network, Plus } from "lucide-react";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";
import { initializeOrgTree, saveOrgNodeVisualPosition, toggleComplaintEscalationMember } from "@/lib/orgTree";
import { sortComplaintChainByTree } from "@/lib/escalation";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import FreeOrgCanvas from "@/components/hr/FreeOrgCanvas";
import OrgTreeGuide from "@/components/hr/OrgTreeGuide";
import OrgTreeNodeModal from "@/components/hr/OrgTreeNodeModal";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";

export default function FlexOrgTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const [editing, setEditing] = useState(undefined);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);
  const treeRef = useRef(null);
  const nodes = data.orgTree || [];
  const escalationChain = useMemo(() => sortComplaintChainByTree(data.complaintEscalationChain || [], data), [data.complaintEscalationChain, data.orgTree]);
  const canManage = isCompanyOwner(currentUser, data) || canManageEmployees(currentUser) || hasHRPermission(currentUser, data, "manage_employees");
  const setSafeZoom = (value) => setZoom(Math.max(.1, Math.min(1.5, value)));
  const gestures = useOrgTreeViewport(viewportRef, zoom, setSafeZoom);
  const fitTree = () => {
    if (!viewportRef.current || !treeRef.current) return;
    const widthScale = (viewportRef.current.clientWidth - 48) / treeRef.current.offsetWidth;
    const heightScale = (viewportRef.current.clientHeight - 48) / treeRef.current.offsetHeight;
    setSafeZoom(Math.min(widthScale, heightScale));
  };
  useEffect(() => initializeOrgTree(company.id, data), [company.id, data.orgTree, data.stations]);
  const toggleEscalation = (employeeId) => toggleComplaintEscalationMember(company.id, employeeId);
  const moveVisual = (nodeId, position) => saveOrgNodeVisualPosition(company.id, nodeId, position);
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-card shadow-sm" dir={ar ? "rtl" : "ltr"}><header className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-primary px-4 py-4 text-primary-foreground"><div className="flex items-center gap-3"><span className="rounded-lg bg-accent/15 p-2"><Network className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{ar ? "الشجرة التنظيمية المرنة" : "Flexible organization tree"}</h2><p className="text-[11px] text-primary-foreground/70">{ar ? "اسحب أي محطة أو شخص إلى اليمين أو اليسار أو الأعلى أو الأسفل" : "Drag any station or person left, right, above, or below"}</p></div></div><div className="flex items-center gap-2"><HierarchyZoomControls zoom={zoom} onZoom={(change) => setSafeZoom(zoom + change)} onSetZoom={setSafeZoom} onFit={fitTree} ar={ar} />{canManage && <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة" : "Add"}</button>}</div></header>
    <OrgTreeGuide ar={ar} />
    <div ref={viewportRef} {...gestures} className="max-h-[760px] cursor-grab overflow-auto p-6 active:cursor-grabbing" style={{ touchAction: "none" }}>{nodes.length ? <FreeOrgCanvas ref={treeRef} nodes={nodes} data={data} savedPositions={data.orgVisualPositions || {}} escalationChain={escalationChain} canManage={canManage} ar={ar} zoom={zoom} onMove={moveVisual} onEdit={setEditing} onToggleEscalation={toggleEscalation} /> : <div className="py-12 text-center"><Network className="mx-auto h-8 w-8 text-accent" /><p className="mt-3 text-sm font-semibold">{ar ? "ابدأ بإضافة أول عقدة" : "Add the first node to begin"}</p></div>}</div>
    {editing !== undefined && <OrgTreeNodeModal initial={editing} data={data} company={company} companyId={company.id} lang={lang} onClose={() => setEditing(undefined)} />}
  </section>;
}