import React, { useMemo, useRef, useState } from "react";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import HROrgEmployeeNode from "@/components/hr/HROrgEmployeeNode";
import HROrgManagerBranch from "@/components/hr/HROrgManagerBranch";
import HROrgUnassignedBranch from "@/components/hr/HROrgUnassignedBranch";
import buildHROrgModel from "@/components/hr/buildHROrgModel";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";

export default function HROrgTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const model = useMemo(() => buildHROrgModel(data, company, currentUser), [data, company, currentUser]);
  const branchCount = model.groups.length + (model.unassigned.length ? 1 : 0);
  const fitZoom = Math.max(0.5, Math.min(1, 3 / Math.max(branchCount, 1)));
  const [customZoom, setCustomZoom] = useState(null);
  const viewportRef = useRef(null);
  const zoom = customZoom ?? fitZoom;
  const setZoom = (value) => setCustomZoom(Math.max(0.5, Math.min(1.5, Number(value.toFixed(2)))));
  const gestures = useOrgTreeViewport(viewportRef, zoom, setZoom);
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-muted/30 shadow-sm" dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-card px-4 py-3"><div><h2 className="font-heading text-lg font-semibold">{ar ? "الهيكل التنظيمي" : "Organization tree"}</h2><p className="text-[11px] text-muted-foreground">{ar ? "المالك، فريق الموارد البشرية، والمحطات المرتبطة" : "Owner, HR team and supervised stations"}</p></div><HierarchyZoomControls zoom={zoom} onZoom={(change) => setZoom(zoom + change)} onFit={() => setCustomZoom(null)} ar={ar} /></div>
    <div ref={viewportRef} {...gestures} className="max-h-[720px] cursor-grab overflow-auto p-5 active:cursor-grabbing md:p-8" style={{ touchAction: "none" }}><div className="mx-auto min-w-max origin-top" style={{ zoom }}>
      <div className="flex justify-center"><HROrgEmployeeNode employee={model.owner || { name: company?.name, role: "owner" }} ar={ar} title={ar ? "المالك" : "Organization owner"} variant="owner" /></div>
      {branchCount ? <><div className="mx-auto h-10 w-px bg-accent/30" /><div className="relative flex items-start justify-center gap-8 border-t border-accent/30 px-10">{model.groups.map((group) => <HROrgManagerBranch key={group.manager.id} group={group} ar={ar} lang={lang} />)}{model.unassigned.length > 0 && <HROrgUnassignedBranch stations={model.unassigned} ar={ar} lang={lang} />}</div></> : <p className="mt-6 text-center text-sm text-muted-foreground">{ar ? "لا توجد محطات أو تعيينات HR" : "No stations or HR assignments"}</p>}
    </div></div>
  </section>;
}