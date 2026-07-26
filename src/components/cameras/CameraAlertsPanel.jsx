import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export default function CameraAlertsPanel({ companyId, currentUser, cameras, stations, ar, onUnreadChange }) {
  const [alerts, setAlerts] = useState([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (currentUser.role !== "ops_manager") return;
    const response = await base44.functions.invoke("cameraAlerts", { action: "list", companyId, sessionToken: getCompanyToken(companyId) });
    const next = response.data?.alerts || []; setAlerts(next); onUnreadChange?.(next.filter((item) => item.status === "new").length); setLoading(false);
  }, [companyId, currentUser.role, onUnreadChange]);
  useEffect(() => { if (currentUser.role !== "ops_manager") return undefined; load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, [load, currentUser.role]);
  if (currentUser.role !== "ops_manager") return null;
  const acknowledge = async (alertId) => { await base44.functions.invoke("cameraAlerts", { action: "acknowledge", alertId, companyId, sessionToken: getCompanyToken(companyId) }); await load(); };
  const cameraName = (id) => cameras.find((item) => item.id === id)?.name || id;
  const stationName = (id) => stations.find((item) => item.id === id)?.name || "—";
  return <section className="rounded-xl border border-destructive/30 bg-card">
    <div className="flex items-center gap-3 border-b border-border p-4"><AlertTriangle className="h-5 w-5 text-destructive" /><div><h2 className="font-heading text-lg font-semibold">{ar ? "تنبيهات الحركة غير المعتادة" : "Unusual motion alerts"}</h2><p className="text-xs text-muted-foreground">{ar ? "تحديث تلقائي كل 10 ثوانٍ" : "Automatically refreshed every 10 seconds"}</p></div></div>
    {loading ? <div className="grid place-items-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : alerts.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{ar ? "لا توجد تنبيهات أمنية." : "No security alerts."}</p> : <div className="divide-y divide-border">{alerts.slice(0, 10).map((alert) => <div key={alert.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1"><p className="font-semibold text-sm">{cameraName(alert.cameraId)} · {stationName(alert.stationId)}</p><p className="text-xs text-muted-foreground">{alert.description || alert.eventType} · {alert.confidence == null ? "—" : `${Math.round(alert.confidence * 100)}%`} · {new Date(alert.occurredAt).toLocaleString(ar ? "ar-SA" : "en")}</p></div>
      {alert.status === "new" ? <button onClick={() => acknowledge(alert.id)} className="inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs"><Check className="h-4 w-4" />{ar ? "تمت المراجعة" : "Acknowledge"}</button> : <span className="text-xs text-muted-foreground">{ar ? "تمت المراجعة" : "Acknowledged"}</span>}
    </div>)}</div>}
  </section>;
}