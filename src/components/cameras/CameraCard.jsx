import React from "react";
import { Camera, MapPin, Pencil, Trash2 } from "lucide-react";
import CameraStream from "@/components/cameras/CameraStream";

export default function CameraCard({ camera, station, companyId, sessionToken, connectionStatus = "unknown", onStatusChange, canManage, ar, onEdit, onDelete }) {
  const status = connectionStatus === "loading" ? "unknown" : connectionStatus;
  const label = status === "online" ? (ar ? "متصلة" : "Online") : status === "offline" ? (ar ? "منقطعة" : "Offline") : (ar ? "غير معروفة" : "Unknown");
  const tone = status === "online" ? "bg-emerald-500/15 text-emerald-400" : status === "offline" ? "bg-red-500/15 text-red-400" : "bg-primary-foreground/10 text-primary-foreground/60";
  return <article className="camera-device-row">
    <div className="camera-device-preview"><CameraStream camera={camera} companyId={companyId} sessionToken={sessionToken} ar={ar} onStatusChange={onStatusChange} /></div>
    <div className="camera-device-identity"><h2><Camera className="h-4 w-4" />{camera.name}</h2><p><MapPin className="h-3.5 w-3.5" />{station?.name || (ar ? "محطة غير محددة" : "No station")}</p></div>
    <div className="camera-device-meta"><span>{camera.provider || (ar ? "أخرى" : "Other")}</span><small>{camera.connectionType === "local" ? "Local" : camera.connectionType === "custom" ? "Custom URL" : "Cloud P2P"}</small></div>
    <span className={`camera-device-status ${tone}`}>● {label}</span>
    {canManage && <div className="camera-device-actions"><button onClick={() => onEdit(camera)}><Pencil className="h-3.5 w-3.5" />{ar ? "إدارة" : "Manage"}</button><button onClick={() => onDelete(camera)}><Trash2 className="h-3.5 w-3.5" />{ar ? "حذف" : "Delete"}</button></div>}
  </article>;
}