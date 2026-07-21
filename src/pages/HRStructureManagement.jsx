import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { canManageHRLevels, canAssignMultiStation, canManageStations, visibleStations } from "@/lib/permissions";
import { Building2, ChevronRight, ArrowLeft, GripVertical } from "lucide-react";
import ClusterEditor from "@/components/hr/ClusterEditor";
import HRTiersEditor from "@/components/hr/HRTiersEditor";
import HROrgChart from "@/components/hr/HROrgChart";
import EscalationInfoBox from "@/components/escalation/EscalationInfoBox";
import GradeEmployeeFilter from "@/components/hr/GradeEmployeeFilter";

export default function HRStructureManagement() {
  const { t, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);
  const canMultiStation = data && currentUser && canAssignMultiStation(currentUser, data);

  useEffect(() => {
    if (!data || !currentUser) return;
    if (selectedStation && !visibleStations(currentUser, data).some((station) => station.id === selectedStation)) setSelectedStation(null);
  }, [data?.stations, currentUser, selectedStation]);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const station = stations.find((s) => s.id === selectedStation);

  // Drag-and-drop reordering of the station cards (reorders the underlying station list).
  const canReorderStations = canManageStations(currentUser);
  const handleStationDragEnd = (result) => {
    if (!result.destination || !canReorderStations) return;
    const ids = stations.map((s) => s.id);
    const reordered = Array.from(ids);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateCompany(company.id, (d) => {
      const byId = Object.fromEntries(d.stations.map((s) => [s.id, s]));
      const positions = [];
      d.stations.forEach((s, i) => { if (ids.includes(s.id)) positions.push(i); });
      const next = [...d.stations];
      positions.forEach((pos, idx) => { next[pos] = byId[reordered[idx]]; });
      d.stations = next;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <EscalationInfoBox t={t} />
      <GradeEmployeeFilter data={data} currentUser={currentUser} ar={dir === "rtl"} />

      {canManage && (
        <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/5">
          <p className="text-xs text-muted-foreground font-body">{t("clusterManagerNote")}</p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("clusterLevel")}</h2>
        <ClusterEditor data={data} canManage={canManage} myStationId={currentUser.stationId} />
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("hrLevels")}</h2>
          <HRTiersEditor data={data} canManage={canManage} canMultiStation={canMultiStation} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" /> {t("orgChart")}
        </h2>

        {!selectedStation ? (
          stations.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t("noTasks")}</p>
          ) : (
            <DragDropContext onDragEnd={handleStationDragEnd}>
              <Droppable droppableId="hr-station-cards">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stations.map((s, index) => (
                      <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={!canReorderStations}>
                        {(dragProvided, dragSnapshot) => (
                          <button
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => setSelectedStation(s.id)}
                            className={`flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted transition text-start ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-accent/40" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              {canReorderStations && (
                                <span {...dragProvided.dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                                  <GripVertical className="w-4 h-4" />
                                </span>
                              )}
                              <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-accent" />
                              </div>
                              <p className="text-sm font-medium font-body">{s.name}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-muted-foreground ${dir === "rtl" ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )
        ) : (
          <div className="space-y-3">
            <button onClick={() => setSelectedStation(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
            </button>
            {station && <HROrgChart station={station} data={data} canManage={canManage} company={company} />}
          </div>
        )}
      </section>
    </div>
  );
}