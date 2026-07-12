import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { getSyncStatus, subscribe } from "@/lib/store";

// Live cloud-sync health badge: green = everything saved to the cloud,
// spinning = pulling latest data, amber = local changes waiting to upload
// (offline or a failed push being retried automatically).
export default function SyncStatusIndicator({ isSyncing, lang }) {
  const ar = lang === "ar";
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => {
    const update = () => setStatus(getSyncStatus());
    const unsub = subscribe(update);
    const interval = setInterval(update, 4000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      unsub();
      clearInterval(interval);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (status.offline || status.pending > 0) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-amber-600" title={ar ? "تغييرات بانتظار الرفع للسحابة" : "Changes waiting to upload"}>
        <CloudOff className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">{ar ? "بانتظار المزامنة" : "Pending sync"}</span>
      </span>
    );
  }
  if (isSyncing) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={2} />
        <span className="hidden sm:inline">{ar ? "جارٍ المزامنة..." : "Syncing..."}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] text-emerald-600" title={ar ? "كل البيانات محفوظة في السحابة" : "All data saved to the cloud"}>
      <Cloud className="w-3.5 h-3.5" strokeWidth={2} />
      <span className="hidden sm:inline">{ar ? "متزامن" : "Synced"}</span>
    </span>
  );
}