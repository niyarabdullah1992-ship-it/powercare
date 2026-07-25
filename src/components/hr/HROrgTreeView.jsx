import React, { useEffect, useMemo, useRef, useState } from "react";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";
import { assignHRTreeEmployee, initializeHROrgTree, moveHROrgNode, setHRTreeRole, unassignHRTreeEmployee } from "@/lib/hrOrgTree";
import HROrgTreeHeader from "@/components/hr/HROrgTreeHeader";
import HROrgBranch from "@/components/hr/HROrgBranch";
import HROrgUnassigned from "@/components/hr/HROrgUnassigned";
import HROrgRolePicker from "@/components/hr/HROrgRolePicker";
import OrgTreeDragCancel from "@/components/hr/OrgTreeDragCancel";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";

export default function HROrgTreeView({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const [dragging, setDragging] = useState(null); const [editing, setEditing] = useState(null);
  const [zoom, setZoomState] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 }); const [fullscreen, setFullscreen] = useState(false);
  const sectionRef = useRef(null); const viewportRef = useRef(null); const treeRef = useRef(null);
  const nodes = data.hrOrgTree || [];
  const validLevels = useMemo(() => new Set((data.hrLevels || []).map((level) => level.id)), [data.hrLevels]);
  const hrEmployees = useMemo(() => (data.employees || []).filter((employee) => validLevels.has(employee.hrLevelId)), [data.employees, validLevels]);
  const unassigned = useMemo(() => hrEmployees.filter((employee) => { const node = nodes.find((item) => item.type === "employee" && item.refId === employee.id); return !node || (!node.parentId && !nodes.some((item) => item.parentId === node.id)); }), [hrEmployees, nodes]);
  const hiddenIds = new Set(unassigned.map((employee) => nodes.find((node) => node.type === "employee" && node.refId === employee.id)?.id).filter(Boolean));
  const roots = nodes.filter((node) => !node.parentId && !hiddenIds.has(node.id)).sort((a, b) => a.order - b.order);
  const canManage = isCompanyOwner(currentUser, data) || canManageEmployees(currentUser) || hasHRPermission(currentUser, data, "manage_employees");
  const setZoom = (value) => setZoomState(Math.max(.1, Math.min(1.5, value)));
  const pan = (x, y) => setOffset((current) => ({ x: current.x + x, y: current.y + y }));
  const gestures = useOrgTreeViewport(viewportRef, zoom, setZoom, offset, setOffset);
  const fit = () => { if (!viewportRef.current || !treeRef.current) return; setZoom(Math.min((viewportRef.current.clientWidth - 48) / treeRef.current.offsetWidth, (viewportRef.current.clientHeight - 48) / treeRef.current.offsetHeight)); setOffset({ x: 0, y: 0 }); };
  useEffect(() => initializeHROrgTree(company.id, data), [company.id, data.hrOrgTree, data.hrLevels, data.hrClusters, data.stations, data.employees]);
  const actions = { start: setDragging, end: () => setDragging(null), edit: setEditing, drop: (targetId, mode) => { if (mode === "cancel") { setDragging(null); return; } if (mode === "unassign") { unassignHRTreeEmployee(company.id, dragging); setDragging(null); return; } if (String(dragging).startsWith("unassigned:")) assignHRTreeEmployee(company.id, dragging.slice(11), targetId); else moveHROrgNode(company.id, dragging, targetId, ar && mode === "left" ? "right" : ar && mode === "right" ? "left" : mode); setDragging(null); } };
  return <section ref={sectionRef} className={`${fullscreen ? "fixed inset-0 z-[70] flex h-screen w-screen flex-col rounded-none" : "rounded-xl"} overflow-hidden border border-accent/30 bg-card shadow-sm`} dir={ar ? "rtl" : "ltr"}>
    <HROrgTreeHeader ar={ar} zoom={zoom} setZoom={setZoom} fit={fit} pan={pan} fullscreen={fullscreen} toggleFullscreen={(next) => { setFullscreen(next); setTimeout(fit, 50); }} sectionRef={sectionRef} />
    <div ref={viewportRef} {...gestures} className={`${fullscreen ? "min-h-0 flex-1" : "h-[70vh] min-h-[440px] max-h-[780px]"} cursor-grab overflow-hidden p-6 active:cursor-grabbing`} style={{ touchAction: "none" }}><div ref={treeRef} className="mx-auto flex min-w-max origin-top items-start justify-center gap-10" style={{ zoom, transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>{roots.map((root) => <HROrgBranch key={root.id} node={root} nodes={nodes} data={data} dragging={dragging} canManage={canManage} lang={lang} actions={actions} />)}</div></div>
    <HROrgUnassigned employees={unassigned} canManage={canManage} dropActive={Boolean(dragging && !nodes.some((node) => node.parentId === dragging))} actions={actions} ar={ar} /><OrgTreeDragCancel active={Boolean(dragging)} ar={ar} />
    <HROrgRolePicker employee={editing} levels={data.hrLevels || []} lang={lang} onSelect={(levelId) => { setHRTreeRole(company.id, editing.id, levelId); setEditing(null); }} onClose={() => setEditing(null)} />
  </section>;
}