import React, { useState } from "react";
import { Camera, FileUp, Link2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { getCompanyToken, updateCompany } from "@/lib/store";
import { visibleStations } from "@/lib/permissions";
import PageHeader from "@/components/PageHeader";
import CameraCard from "@/components/cameras/CameraCard";
import CameraMap from "@/components/cameras/CameraMap";
import CameraForm from "@/components/cameras/CameraForm";
import CameraSetupWizard from "@/components/cameras/CameraSetupWizard";
import CameraCsvImport from "@/components/cameras/CameraCsvImport";
import CameraDiscovery from "@/components/cameras/CameraDiscovery";
import CameraAlertsPanel from "@/components/cameras/CameraAlertsPanel";
import MonitoringSummary from "@/components/cameras/MonitoringSummary";
import StationCameraOverview from "@/components/cameras/StationCameraOverview";

export default function Cameras() {
  const { data, currentUser, company } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [editing, setEditing] = useState(null); const [formOpen, setFormOpen] = useState(false); const [wizardOpen, setWizardOpen] = useState(false); const [importOpen, setImportOpen] = useState(false); const [discoveredAddress, setDiscoveredAddress] = useState(""); const [selectedStationId, setSelectedStationId] = useState(null); const [connectionStatuses, setConnectionStatuses] = useState({}); const [unreadAlerts, setUnreadAlerts] = useState(0);
  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data); const stationIds = new Set(stations.map((item) => item.id));
  const cameras = (data.cameras || []).filter((item) => stationIds.has(item.stationId));
  const shownCameras = selectedStationId ? cameras.filter((item) => item.stationId === selectedStationId) : cameras;
  const selectedStation = stations.find((item) => item.id === selectedStationId);
  const canManage = currentUser.id === data.ownerId || ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role);
  const save = (values) => { updateCompany(company.id, (current) => { current.cameras = current.cameras || []; const item = { ...values, lat: values.lat === "" ? null : Number(values.lat), lng: values.lng === "" ? null : Number(values.lng) }; if (editing) current.cameras = current.cameras.map((camera) => camera.id === editing.id ? { ...camera, ...item } : camera); else current.cameras.push({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }); }); setEditing(null); setFormOpen(false); setWizardOpen(false); setDiscoveredAddress(""); };
  const remove = (camera) => { if (!window.confirm(ar ? "حذف هذه الكاميرا؟" : "Delete this camera?")) return; updateCompany(company.id, (current) => { current.cameras = (current.cameras || []).filter((item) => item.id !== camera.id); }); };
  const importRows = (rows) => { updateCompany(company.id, (current) => { current.cameras = current.cameras || []; current.cameras.push(...rows.map((row) => { const station = stations.find((item) => item.id === row.stationId); return { ...row, id: crypto.randomUUID(), lat: station?.lat ?? null, lng: station?.lng ?? null, createdAt: new Date().toISOString() }; })); }); setImportOpen(false); };
  const useDiscovered = (address) => { setDiscoveredAddress(address); setWizardOpen(true); };
  return <div className="camera-center camera-command-center space-y-3"><PageHeader title={ar ? "مركز العمليات الأمنية" : "Security Operations Center"} description={ar ? "إدارة التنبيهات الأمنية والكاميرات المرتبطة بالمحطات من مركز موحّد." : "Manage security alerts and station cameras from one unified center."} icon={Camera} actions={<div className="flex flex-wrap gap-2">{canManage && <><button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"><FileUp className="h-4 w-4" />{ar ? "استيراد CSV" : "Import CSV"}</button><button onClick={() => { setDiscoveredAddress(""); setWizardOpen(true); }} className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"><Link2 className="h-4 w-4" />{ar ? "ربط كاميرا" : "Connect camera"}</button></>}</div>} />
    <MonitoringSummary cameras={cameras} statuses={connectionStatuses} unreadAlerts={unreadAlerts} ar={ar} />
    <StationCameraOverview stations={stations} cameras={cameras} statuses={connectionStatuses} ar={ar} onSelect={setSelectedStationId} />
    {canManage && <CameraDiscovery ar={ar} onUse={useDiscovered} />}
    <div className="camera-command-map-grid"><CameraMap cameras={cameras} stations={stations} statuses={connectionStatuses} ar={ar} onSelectStation={setSelectedStationId} /><CameraAlertsPanel companyId={company.id} currentUser={currentUser} cameras={cameras} stations={stations} ar={ar} onUnreadChange={setUnreadAlerts} /></div>
    {selectedStation && <div className="flex items-center justify-between rounded-lg border border-accent/25 bg-card px-4 py-3"><p className="text-sm font-semibold">{ar ? `كاميرات محطة ${selectedStation.name}` : `${selectedStation.name} cameras`}</p><button onClick={() => setSelectedStationId(null)} className="text-xs text-accent hover:underline">{ar ? "عرض جميع المحطات" : "Show all stations"}</button></div>}
    <div className="camera-device-register grid gap-2">{shownCameras.map((camera) => <CameraCard key={camera.id} camera={camera} station={stations.find((item) => item.id === camera.stationId)} companyId={company.id} sessionToken={getCompanyToken(company.id)} connectionStatus={connectionStatuses[camera.id]} onStatusChange={(status) => setConnectionStatuses((current) => current[camera.id] === status ? current : { ...current, [camera.id]: status })} canManage={canManage} ar={ar} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={remove} />)}</div>
    {!cameras.length && <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{ar ? "لا توجد كاميرات مرتبطة بعد." : "No cameras linked yet."}</div>}
    {formOpen && <CameraForm key={editing?.id || "new"} initial={editing} stations={stations} ar={ar} onSave={save} onClose={() => { setFormOpen(false); setEditing(null); }} />}
    {wizardOpen && <CameraSetupWizard key={discoveredAddress || "wizard"} stations={stations} companyId={company.id} sessionToken={getCompanyToken(company.id)} ar={ar} initialAddress={discoveredAddress} onSave={save} onClose={() => { setWizardOpen(false); setDiscoveredAddress(""); }} />}
    {importOpen && <CameraCsvImport stations={stations} ar={ar} onImport={importRows} onClose={() => setImportOpen(false)} />}
  </div>;
}