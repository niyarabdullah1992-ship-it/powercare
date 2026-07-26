import React from "react";
import { Camera, MapPin, Pencil, Trash2 } from "lucide-react";
import CameraStream from "@/components/cameras/CameraStream";

export default function CameraCard({ camera, station, companyId, sessionToken, connectionStatus = "unknown", onStatusChange, canManage, ar, onEdit, onDelete }) {
  const status = connectionStatus === "loading" ? "unknown" : connectionStatus;
  const label = status === "online" ? (ar ? "متصلة" : "Online") : status === "offline" ? (ar ? "منقطعة" : "Offline") : (ar ? "غير معروفة" : "Unknown");
  const tone = status === "online" ? "bg-emerald-500/15 text-emerald-400" : status === "offline" ? "bg-red-500/15 text-red-400" : "bg-primary-foreground/10 text-primary-foreground/60";
  return <article className="overflow-hidden rounded-xl border border-accent/20 bg-primary text-primary-foreground shadow-elevated">
    <CameraStream camera={camera} companyId={companyId} sessionToken={sessionToken} ar={ar} onStatusChange={onStatusChange} />
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Camera className="h-4 w-4 text-accent" />{camera.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-primary-foreground/60"><MapPin className="h-3.5 w-3.5" />{station?.name || (ar ? "محطة غير محددة" : "No station")}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tone}`}>● {label}</span></div>
      <p className="text-[10px] text-primary-foreground/45">{camera.provider || (ar ? "أخرى" : "Other")} · {camera.connectionType === "local" ? "Local" : camera.connectionType === "custom" ? "Custom URL" : "Cloud P2P"}</p>
      {canManage && <div className="flex gap-2 border-t border-primary-foreground/15 pt-3"><button onClick={() => onEdit(camera)} className="flex items-center gap-1 text-xs text-accent"><Pencil className="h-3.5 w-3.5" />{ar ? "تعديل" : "Edit"}</button><button onClick={() => onDelete(camera)} className="ms-auto flex items-center gap-1 text-xs text-red-400"><Trash2 className="h-3.5 w-3.5" />{ar ? "حذف" : "Delete"}</button></div>}
    </div>
  </article>;
}