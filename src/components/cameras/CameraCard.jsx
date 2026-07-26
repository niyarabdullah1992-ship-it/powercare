import React from "react";
import { Camera, MapPin, Pencil, Trash2 } from "lucide-react";
import CameraStream from "@/components/cameras/CameraStream";

export default function CameraCard({ camera, station, companyId, sessionToken, canManage, ar, onEdit, onDelete }) {
  return <article className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
    <CameraStream camera={camera} companyId={companyId} sessionToken={sessionToken} ar={ar} />
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Camera className="h-4 w-4 text-accent" />{camera.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{station?.name || (ar ? "محطة غير محددة" : "No station")}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${camera.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{camera.status === "active" ? (ar ? "نشطة" : "Active") : (ar ? "متوقفة" : "Offline")}</span></div>
      {canManage && <div className="flex gap-2 border-t border-border pt-3"><button onClick={() => onEdit(camera)} className="flex items-center gap-1 text-xs text-accent"><Pencil className="h-3.5 w-3.5" />{ar ? "تعديل" : "Edit"}</button><button onClick={() => onDelete(camera)} className="ms-auto flex items-center gap-1 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" />{ar ? "حذف" : "Delete"}</button></div>}
    </div>
  </article>;
}