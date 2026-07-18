import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { canManageStations, visibleStations } from "@/lib/permissions";
import { canAddStation } from "@/lib/planLimits";
import { Link } from "react-router-dom";
import { Plus, Radio, Users, Pencil, Check, X, BarChart3, GripVertical, MapPin } from "lucide-react";
import StationDeleteDialog from "@/components/stations/StationDeleteDialog";
import StationAnalyticsModal from "@/components/stations/StationAnalyticsModal";
import StationTypeEditor from "@/components/stations/StationTypeEditor";
import StationLocationEditor from "@/components/stations/StationLocationEditor";
import PageHeader from "@/components/PageHeader";

export default function Stations() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", type: "", lat: null, lng: null, radiusMeters: null });
  const [pickingNewLocation, setPickingNewLocation] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [analyticsFor, setAnalyticsFor] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const canManage = canManageStations(currentUser, data);

  const stationLimitReached = !canAddStation(company, data);

  const add = (e) => {
    e.preventDefault();
    if (stationLimitReached) return;
    updateCompany(company.id, (d) => {
      d.stations.push({
        id: "st_" + Math.random().toString(36).slice(2, 9),
        name: form.name,
        location: form.location,
        type: form.type,
        status: "active",
        managerId: null,
        lat: form.lat,
        lng: form.lng,
        radiusMeters: form.radiusMeters,
        createdAt: new Date().toISOString(),
      });
    });
    setShowAdd(false);
    setPickingNewLocation(false);
    setForm({ name: "", location: "", type: "", lat: null, lng: null, radiusMeters: null });
  };

  const cycleStatus = (id) => {
    if (!canManage) return;
    const order = ["active", "maintenance", "stopped"];
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) s.status = order[(order.indexOf(s.status) + 1) % order.length];
    });
  };

  const saveType = (id, value) => {
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) s.type = value;
    });
    setEditingTypeId(null);
  };

  const saveLocation = (id, coords) => {
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) { s.lat = coords.lat; s.lng = coords.lng; s.radiusMeters = coords.radiusMeters; }
    });
    setEditingLocationId(null);
  };

  // Reorders stations within a single type-section by drag, keeping other sections' order intact.
  const reorderGroup = (groupIds, fromIndex, toIndex) => {
    if (!canManage) return;
    const reorderedIds = Array.from(groupIds);
    const [moved] = reorderedIds.splice(fromIndex, 1);
    reorderedIds.splice(toIndex, 0, moved);
    updateCompany(company.id, (d) => {
      const byId = Object.fromEntries(d.stations.map((s) => [s.id, s]));
      const positions = [];
      d.stations.forEach((s, i) => { if (groupIds.includes(s.id)) positions.push(i); });
      const next = [...d.stations];
      positions.forEach((pos, idx) => { next[pos] = byId[reorderedIds[idx]]; });
      d.stations = next;
    });
  };

  // group stations by type — sections a user can reorder within
  const groups = {};
  stations.forEach((s) => {
    const key = s.type?.trim() || t("customType");
    groups[key] = groups[key] || [];
    groups[key].push(s);
  });

  // A single shared drag context handles every section — multiple DragDropContexts
  // mounted at once conflict with each other and only the first one works.
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const type = result.source.droppableId.replace("stations-group-", "");
    const groupIds = (groups[type] || []).map((s) => s.id);
    reorderGroup(groupIds, result.source.index, result.destination.index);
  };

  const startRename = (id, currentName) => {
    setRenamingId(id);
    setRenameVal(currentName);
  };

  const submitRename = () => {
    const name = renameVal.trim();
    if (!name) { setRenamingId(null); return; }
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === renamingId);
      if (s) s.name = name;
    });
    setRenamingId(null);
  };

  const statusTone = (s) => ({
    active: "bg-accent/15 text-accent",
    maintenance: "bg-amber-100 text-amber-700",
    stopped: "bg-destructive/15 text-destructive",
  }[s] || "bg-muted");

  const renameField = (id, name) =>
    renamingId === id ? (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") setRenamingId(null); }}
          className="px-2 py-1 rounded-md border border-input text-sm font-body font-heading font-semibold"
        />
        <button onClick={submitRename} className="p-1 rounded-md hover:bg-accent/10 text-accent"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => setRenamingId(null)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 group">
        <h3 className="font-heading font-semibold">{name}</h3>
        {canManage && (
          <button onClick={() => startRename(id, name)} className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("stations")}
        description={`${stations.length} ${t("stations").toLowerCase()}`}
        icon={Radio}
        actions={canManage && (
          <button onClick={() => setShowAdd((open) => !open)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-body hover:bg-accent transition-colors">
            <Plus className="w-4 h-4" /> {t("addStation")}
          </button>
        )}
      />

      {canManage && stationLimitReached && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-body">{t("stationLimitReached")}</p>
          <Link to="/pricing" className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body hover:bg-accent">{t("upgradePlan")}</Link>
        </div>
      )}

      {showAdd && !stationLimitReached && (
        <form onSubmit={add} className="p-5 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("stationName")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("location")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t("stationType")} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <div className="md:col-span-3">
            {pickingNewLocation ? (
              <StationLocationEditor
                t={t}
                station={{ lat: form.lat, lng: form.lng, radiusMeters: form.radiusMeters }}
                onSave={(coords) => { setForm({ ...form, lat: coords.lat, lng: coords.lng, radiusMeters: coords.radiusMeters }); setPickingNewLocation(false); }}
                onCancel={() => setPickingNewLocation(false)}
              />
            ) : (
              <button type="button" onClick={() => setPickingNewLocation(true)} className="flex items-center gap-1.5 text-xs font-body text-accent hover:underline">
                <MapPin className="w-3.5 h-3.5" />
                {form.lat != null && form.lng != null ? `${t("locationSet")} ✓ — ${t("editLocation")}` : t("setLocation")}
              </button>
            )}
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
      {Object.entries(groups).map(([type, items]) => {
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold">{type}</h2>
              <span className="text-xs text-muted-foreground font-body">
                {items.length} {t("stations").toLowerCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Droppable droppableId={`stations-group-${type}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="contents">
                      {items.map((s, index) => {
                        const team = data.employees.filter((e) => (e.stationId || data.stations[0]?.id) === s.id);
                        const manager = data.employees.find((e) => e.id === s.managerId);
                        const tasks = data.tasks.filter((tk) => tk.stationId === s.id);
                        // Station managers can set the GPS location of their own station.
                        const canSetLocation = canManage || (currentUser.role === "station_manager" && (s.managerId === currentUser.id || currentUser.stationId === s.id));
                        const done = tasks.filter((tk) => tk.status === "completed").length;
                        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
                        return (
                          <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={!canManage}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`p-5 rounded-xl border border-border bg-card space-y-3 transition-shadow ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-accent/40" : ""}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    {canManage && (
                                      <span {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                                        <GripVertical className="w-4 h-4" />
                                      </span>
                                    )}
                                    <Radio className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        {renameField(s.id, s.name)}
                                      </div>
                                      {editingTypeId === s.id ? (
                                        <StationTypeEditor t={t} onSave={(val) => saveType(s.id, val)} onCancel={() => setEditingTypeId(null)} />
                                      ) : (
                                        <div className="flex items-center gap-1 group">
                                          <p className="text-xs text-muted-foreground font-body">{s.location} · {s.type}</p>
                                          {canManage && (
                                            <button onClick={() => setEditingTypeId(s.id)} className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => cycleStatus(s.id)} disabled={!canManage} className={`px-2 py-0.5 rounded-full text-[10px] font-body ${statusTone(s.status)} ${canManage ? "cursor-pointer" : "cursor-default"}`}>
                                      {s.status}
                                    </button>
                                    {canManage && <StationDeleteDialog station={s} stations={data.stations} data={data} company={company} lang={lang} />}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-sm font-body">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="w-3.5 h-3.5" /> {team.length}
                                  </span>
                                  <span className="text-muted-foreground">{pct}% {t("taskCompletion").toLowerCase()}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-xs font-body">
                                  {manager ? <span className="text-foreground">{t("manager")}: {manager.name}</span> : <span className="text-amber-600">⚠ {t("noManager")}</span>}
                                </p>
                                {editingLocationId === s.id ? (
                                  <StationLocationEditor t={t} station={s} onSave={(coords) => saveLocation(s.id, coords)} onCancel={() => setEditingLocationId(null)} />
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <button onClick={() => setAnalyticsFor({ key: s.id, name: s.name, members: team })} className="flex items-center gap-1 text-xs text-accent hover:underline">
                                      <BarChart3 className="w-3.5 h-3.5" /> {t("analytics")}
                                    </button>
                                    {canSetLocation && (
                                      <button onClick={() => setEditingLocationId(s.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                        <MapPin className="w-3.5 h-3.5" /> {s.lat != null && s.lng != null ? t("editLocation") : t("setLocation")}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
            </div>
          </div>
        );
      })}
      </DragDropContext>

      {analyticsFor && (
        <StationAnalyticsModal
          stationKey={analyticsFor.key}
          stationName={analyticsFor.name}
          members={analyticsFor.members}
          onClose={() => setAnalyticsFor(null)}
        />
      )}
    </div>
  );
}