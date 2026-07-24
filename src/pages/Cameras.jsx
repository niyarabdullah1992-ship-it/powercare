import React, { useState } from "react";
import { Camera, Plus } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { visibleStations } from "@/lib/permissions";
import PageHeader from "@/components/PageHeader";
import CameraCard from "@/components/cameras/CameraCard";
import CameraMap from "@/components/cameras/CameraMap";
import CameraForm from "@/components/cameras/CameraForm";

export default function Cameras() {
  const { data, currentUser, company } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [editing, setEditing] = useState(null); const [formOpen, setFormOpen] = useState(false); const [selectedStationId, setSelectedStationId] = useState(null);
  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data); const stationIds = new Set(stations.map((item) => item.id));
  const cameras = (data.cameras || []).filter((item) => stationIds.has(item.stationId));
  const shownCameras = selectedStationId ? cameras.filter((item) => item.stationId === selectedStationId) : cameras;
  const selectedStation = stations.find((item) => item.id === selectedStationId);
  const canManage = currentUser.id === data.ownerId || ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role);
  const save = (values) => { updateCompany(company.id, (current) => { current.cameras = current.cameras || []; const item = { ...values, lat: values.lat === "" ? null : Number(values.lat), lng: values.lng === "" ? null : Number(values.lng) }; if (editing) current.cameras = current.cameras.map((camera) => camera.id === editing.id ? { ...camera, ...item } : camera); else current.cameras.push({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }); }); setEditing(null); setFormOpen(false); };
  const remove = (camera) => { if (!window.confirm(ar ? "حذف هذه الكاميرا؟" : "Delete this camera?")) return; updateCompany(company.id, (current) => { current.cameras = (current.cameras || []).filter((item) => item.id !== camera.id); }); };
  return <div className="space-y-6"><PageHeader title={ar ? "مركز الكاميرات" : "Camera Center"} description={ar ? "مراقبة كاميرات IP وربطها بالمحطات والمواقع الجغرافية." : "Monitor IP cameras linked to stations and geographic locations."} icon={Camera} actions={canManage && <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة كاميرا" : "Add camera"}</button>} />
    <CameraMap cameras={cameras} stations={stations} ar={ar} onSelectStation={setSelectedStationId} />
    {selectedStation && <div className="flex items-center justify-between rounded-lg border border-accent/25 bg-card px-4 py-3"><p className="text-sm font-semibold">{ar ? `كاميرات محطة ${selectedStation.name}` : `${selectedStation.name} cameras`}</p><button onClick={() => setSelectedStationId(null)} className="text-xs text-accent hover:underline">{ar ? "عرض جميع المحطات" : "Show all stations"}</button></div>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shownCameras.map((camera) => <CameraCard key={camera.id} camera={camera} station={stations.find((item) => item.id === camera.stationId)} canManage={canManage} ar={ar} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={remove} />)}</div>
    {!cameras.length && <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{ar ? "لا توجد كاميرات مرتبطة بعد." : "No cameras linked yet."}</div>}
    {formOpen && <CameraForm key={editing?.id || "new"} initial={editing} stations={stations} ar={ar} onSave={save} onClose={() => { setFormOpen(false); setEditing(null); }} />}
  </div>;
}