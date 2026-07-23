import React, { useMemo, useRef, useState } from "react";
import { Crown } from "lucide-react";
import HierarchyZoomControls from "@/components/directory/HierarchyZoomControls";
import HROrgStationBranch from "@/components/hr/HROrgStationBranch";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";

export default function HROrgTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const stations = data.stations || [];
  const employees = data.employees || [];
  const owner = employees.find((item) => item.id === data.ownerId) || employees.find((item) => item.role === "owner" || item.email === company?.ownerEmail) || currentUser;
  const branches = useMemo(() => {
    const grouped = new Map(stations.map((station) => [station.id, []]));
    employees.forEach((employee) => {
      if (employee.id === owner?.id) return;
      const stationId = employee.stationId || employee.managedStations?.[0] || stations[0]?.id;
      if (grouped.has(stationId)) grouped.get(stationId).push(employee);
    });
    return stations.map((station) => ({ station, employees: grouped.get(station.id) || [] }));
  }, [stations, employees, owner?.id]);
  const fitZoom = Math.max(0.5, Math.min(1, 3 / Math.max(stations.length, 1)));
  const [customZoom, setCustomZoom] = useState(null);
  const viewportRef = useRef(null);
  const zoom = customZoom ?? fitZoom;
  const setZoom = (value) => setCustomZoom(Math.max(0.5, Math.min(1.5, Number(value.toFixed(2)))));
  const gestures = useOrgTreeViewport(viewportRef, zoom, setZoom);
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-muted/30 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-card px-4 py-3"><div><h2 className="font-heading text-lg font-semibold">{ar ? "الهيكل التنظيمي" : "Organization tree"}</h2><p className="text-[11px] text-muted-foreground">{ar ? "اسحب للتنقل، واستخدم إصبعين أو Ctrl للتكبير" : "Drag to pan; pinch or use Ctrl to zoom"}</p></div><HierarchyZoomControls zoom={zoom} onZoom={(change) => setZoom(zoom + change)} onFit={() => setCustomZoom(null)} ar={ar} /></div>
    <div ref={viewportRef} {...gestures} className="max-h-[680px] cursor-grab overflow-auto p-5 active:cursor-grabbing md:p-8" style={{ touchAction: "none" }}><div className="mx-auto min-w-max origin-top" style={{ zoom }}>
      <div className="mx-auto w-64 rounded-xl border-2 border-accent bg-primary p-4 text-center text-primary-foreground shadow-elevated"><Crown className="mx-auto h-6 w-6 text-accent" /><p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-primary-foreground/70">{ar ? "الإدارة العامة" : "General management"}</p><h3 className="mt-1 truncate font-heading text-lg font-semibold">{owner?.name || company?.name}</h3></div>
      {branches.length ? <><div className="mx-auto h-10 w-px bg-accent/60" /><div className="relative flex items-start justify-center gap-8 border-t-2 border-accent/45 px-10">{branches.map(({ station, employees: team }) => <HROrgStationBranch key={station.id} station={station} employees={team} ar={ar} />)}</div></> : <p className="mt-6 text-center text-sm text-muted-foreground">{ar ? "لا توجد محطات" : "No stations"}</p>}
    </div></div>
  </section>;
}