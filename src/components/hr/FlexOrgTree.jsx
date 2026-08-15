import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Network, Plus } from "lucide-react";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";
import {
  assignEmployeeToOrgStation,
  initializeOrgTree,
  stationIdForTreeEmployee,
} from "@/lib/orgTree";
import { toast } from "@/components/ui/use-toast";
import HierarchyZoomControls from "@/components/hr/HierarchyZoomControls";
import FlexOrgBranch from "@/components/hr/FlexOrgBranch";
import OrgTreeNodeModal from "@/components/hr/OrgTreeNodeModal";
import OrgTreeSimpleEditor from "@/components/hr/OrgTreeSimpleEditor";
import OrgTreeFullscreenButton from "@/components/hr/OrgTreeFullscreenButton";
import OrgTreeGuide from "@/components/hr/OrgTreeGuide";
import OrgTreeUnassignedEmployees from "@/components/hr/OrgTreeUnassignedEmployees";
import EscalationCoverageDialog from "@/components/hr/EscalationCoverageDialog";
import useOrgTreeViewport from "@/hooks/useOrgTreeViewport";
import useStationScope from "@/hooks/useStationScope";
import { INK, NAVY, CARD } from "@/lib/platformStyles";

export default function FlexOrgTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const [editing, setEditing] = useState(undefined);
  const [organizing, setOrganizing] = useState(null);
  const [escalationEdit, setEscalationEdit] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const treeRef = useRef(null);
  const nodes = data.orgTree || [];
  const headerScope = useStationScope();
  const scopedStationId = headerScope && headerScope !== "all" ? String(headerScope) : null;

  const unassignedEmployees = useMemo(() => (data.employees || []).filter((employee) => {
    if (employee.role === "owner") return false;
    if (scopedStationId && String(employee.stationId || "") !== scopedStationId) return false;
    const node = nodes.find((item) => item.type === "employee" && item.refId === employee.id);
    if (!node) return true;
    const hasChildren = nodes.some((item) => item.parentId === node.id);
    return !node.parentId && !hasChildren && !stationIdForTreeEmployee(data, employee.id) && !(employee.managedStations || []).length;
  }), [data.employees, data.orgTree, scopedStationId]);

  const unassignedNodeIds = useMemo(
    () => new Set(unassignedEmployees.map((employee) => nodes.find((node) => node.type === "employee" && node.refId === employee.id)?.id).filter(Boolean)),
    [unassignedEmployees, nodes],
  );
  const roots = useMemo(() => {
    const allRoots = nodes
      .filter((node) => !node.parentId && !unassignedNodeIds.has(node.id))
      .sort((a, b) => a.order - b.order);
    if (!scopedStationId) return allRoots;
    const stationNode = nodes.find((node) => node.type === "station" && String(node.refId) === scopedStationId);
    if (stationNode) return [stationNode];
    return allRoots.filter((node) => node.type === "station" && String(node.refId) === scopedStationId);
  }, [nodes, unassignedNodeIds, scopedStationId]);
  const canManage = isCompanyOwner(currentUser, data)
    || canManageEmployees(currentUser)
    || hasHRPermission(currentUser, data, "manage_employees");

  const setSafeZoom = (value) => setZoom(Math.max(0.1, Math.min(1.5, value)));
  const panTree = (x, y) => setOffset((current) => ({ x: current.x + x, y: current.y + y }));
  const gestures = useOrgTreeViewport(viewportRef, zoom, setSafeZoom, offset, setOffset);
  const enterFullscreen = () => {
    setFullscreen(true);
    window.setTimeout(fitTree, 80);
  };
  const exitFullscreen = () => {
    setFullscreen(false);
    window.setTimeout(fitTree, 80);
  };

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);
  const fitTree = () => {
    const viewport = viewportRef.current;
    const tree = treeRef.current;
    if (!viewport || !tree) return;
    const pad = 64;
    const vw = Math.max(1, viewport.clientWidth - pad);
    const vh = Math.max(1, viewport.clientHeight - pad);
    const width = Math.max(tree.scrollWidth, tree.offsetWidth, 1);
    const height = Math.max(tree.scrollHeight, tree.offsetHeight, 1);
    if (width < 8 || height < 8) {
      setSafeZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const next = Math.min(vw / width, vh / height);
    setSafeZoom(Number.isFinite(next) ? next : 1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => initializeOrgTree(company.id, data), [company.id, data.orgTree, data.stations]);
  useEffect(() => {
    window.setTimeout(fitTree, 50);
  }, [scopedStationId]);

  const organizeEmployee = (employeeId) => {
    let node = nodes.find((n) => n.type === "employee" && n.refId === employeeId);
    if (!node) {
      const firstStation = nodes.find((n) => n.type === "station")
        || (data.stations?.[0] && { id: `org_station_${data.stations[0].id}`, refId: data.stations[0].id, type: "station" });
      if (!firstStation) {
        toast({
          description: ar ? "أضف فرعًا أولًا من «إضافة»." : "Add a branch first via Add.",
          variant: "destructive",
        });
        return;
      }
      const result = assignEmployeeToOrgStation(company.id, employeeId, firstStation.id);
      if (!result?.ok) {
        toast({
          description: ar ? (result?.reason || "تعذّر الإسناد") : (result?.reasonEn || "Could not place"),
          variant: "destructive",
        });
        return;
      }
      // Re-read after write — Auth will refresh; open by synthetic node for immediate UX.
      node = {
        id: `org_${employeeId}`,
        type: "employee",
        refId: employeeId,
        title: "",
        parentId: firstStation.id,
      };
    }
    setOrganizing(node);
  };

  const actions = {
    edit: setEditing,
    organize: (node) => setOrganizing(node),
    organizeEmployee,
    toggleEscalation: (employeeId, stationId, level) => {
      const sid = stationId
        || scopedStationId
        || stationIdForTreeEmployee(data, employeeId)
        || data.employees.find((item) => item.id === employeeId)?.stationId;
      if (!sid) {
        toast({
          description: ar ? "اختر فرعًا من الهيدر أولًا لإضافة التصعيد." : "Pick a branch in the header first to edit escalation.",
          variant: "destructive",
        });
        return;
      }
      setEscalationEdit({ employeeId, stationId: sid, level: Number(level) || 0 });
    },
    start: () => {},
    end: () => {},
    drop: () => {},
    hit: () => {},
  };

  const tree = (
    <section
      ref={sectionRef}
      className="overflow-hidden"
      style={fullscreen
        ? {
            position: "fixed",
            inset: 0,
            zIndex: 400,
            width: "100vw",
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0,
            border: "none",
            background: CARD,
          }
        : {
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            background: CARD,
            boxShadow: "0 8px 24px rgba(20,40,75,.06)",
          }}
      dir={ar ? "rtl" : "ltr"}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          minHeight: 52,
          padding: "8px 12px 8px 14px",
          borderBottom: "1px solid #E2E8F0",
          background: CARD,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#14284B",
              color: "#fff",
            }}
          >
            <Network style={{ width: 14, height: 14 }} strokeWidth={1.8} />
          </span>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: "-0.02em", color: INK }}>
            {ar ? "الشجرة التنظيمية" : "Organization tree"}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <HierarchyZoomControls zoom={zoom} onZoom={(change) => setSafeZoom(zoom + change)} onSetZoom={setSafeZoom} onFit={fitTree} onPan={panTree} ar={ar} />
          <OrgTreeFullscreenButton
            active={fullscreen}
            onToggle={(next) => (next ? enterFullscreen() : exitFullscreen())}
            ar={ar}
          />
          {canManage && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              title={ar ? "إضافة" : "Add"}
              aria-label={ar ? "إضافة" : "Add"}
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: 9,
                border: "1px solid #1E9E63",
                background: "#1E9E63",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus style={{ width: 16, height: 16 }} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {!fullscreen && <OrgTreeGuide ar={ar} />}

      {!fullscreen && unassignedEmployees.length > 0 && (
        <OrgTreeUnassignedEmployees
          employees={unassignedEmployees}
          canManage={canManage}
          dropActive={false}
          actions={actions}
          ar={ar}
        />
      )}

      <div
        ref={viewportRef}
        {...gestures}
        className="cursor-grab overflow-hidden p-6 active:cursor-grabbing"
        style={{
          touchAction: "none",
          flex: fullscreen ? 1 : undefined,
          minHeight: fullscreen ? 0 : 420,
          height: fullscreen ? "auto" : "70vh",
          maxHeight: fullscreen ? "none" : 760,
          background: `
            radial-gradient(circle at 1px 1px, color-mix(in oklab, #14284B 8%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
            linear-gradient(180deg, #F6F8FB 0%, #FFFFFF 62%)
          `,
        }}
      >
        <div
          ref={treeRef}
          className="mx-auto flex min-w-max origin-top items-start justify-center gap-10"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {roots.length ? roots.map((root) => (
            <FlexOrgBranch
              key={root.id}
              node={root}
              nodes={nodes}
              data={data}
              scopedStationId={scopedStationId}
              canManage={canManage}
              actions={actions}
              ar={ar}
            />
          )) : (
            <div className="py-12 text-center">
              <Network style={{ width: 32, height: 32, margin: "0 auto", color: NAVY }} />
              <p className="mt-3 text-[13px] font-semibold text-[#14284B]">
                {ar ? "أضف فرعًا أو موظفًا للبدء" : "Add a branch or person to begin"}
              </p>
            </div>
          )}
        </div>
      </div>

      {escalationEdit && (
        <EscalationCoverageDialog
          employeeId={escalationEdit.employeeId}
          stationId={escalationEdit.stationId}
          level={escalationEdit.level}
          data={data}
          companyId={company.id}
          ar={ar}
          onClose={() => setEscalationEdit(null)}
        />
      )}

      {organizing && (
        <OrgTreeSimpleEditor
          node={organizing}
          data={data}
          companyId={company.id}
          ar={ar}
          onClose={() => setOrganizing(null)}
        />
      )}

      {editing !== undefined && (
        <OrgTreeNodeModal
          initial={editing}
          data={data}
          company={company}
          companyId={company.id}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setEditing(undefined)}
        />
      )}
    </section>
  );

  return fullscreen ? createPortal(tree, document.body) : tree;
}
