import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// Director-only: define clusters (named groups of stations) used by Tier 2 HR assignment.
// Non-managers (regular station employees) only see their own station's cluster —
// never the clusters/HR grouping of other stations.
export default function ClusterEditor({ data, canManage, myStationId }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [stationIds, setStationIds] = useState([]);
  const allClusters = data.hrClusters || [];
  const clusters = canManage ? allClusters : allClusters.filter((c) => (c.stationIds || []).includes(myStationId));

  const addCluster = (e) => {
    e.preventDefault();
    if (!name.trim() || stationIds.length === 0) return;
    updateCompany(data.id, (d) => {
      d.hrClusters = d.hrClusters || [];
      d.hrClusters.push({ id: "cls_" + Math.random().toString(36).slice(2, 9), name: name.trim(), stationIds });
    });
    setName(""); setStationIds([]); setAdding(false);
  };

  const removeCluster = (id) => {
    updateCompany(data.id, (d) => {
      d.hrClusters = (d.hrClusters || []).filter((c) => c.id !== id);
      d.employees.forEach((e) => {
        if (e.hrClusterId === id) { e.hrLevelId = null; e.hrClusterId = null; }
      });
    });
  };

  if (!canManage && clusters.length === 0) return null;

  return (
    <div className="space-y-2">
      {canManage && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-body">{clusters.length === 0 ? t("noClusters") : ""}</p>
          <button onClick={() => setAdding((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <Plus className="w-3.5 h-3.5" /> {t("addCluster")}
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={addCluster} className="p-4 rounded-xl border border-border bg-card space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("clusterName")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <button
            type="button"
            onClick={() => setStationIds(stationIds.length === data.stations.length ? [] : data.stations.map((s) => s.id))}
            className="text-[11px] text-accent font-body hover:underline"
          >
            {stationIds.length === data.stations.length ? t("deselectAllStations") : t("selectAllStations")}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1.5">
            {data.stations.map((s) => {
              const checked = stationIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStationIds(checked ? stationIds.filter((id) => id !== s.id) : [...stationIds, s.id])}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body text-start transition ${checked ? "bg-foreground text-background" : "hover:bg-muted"}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${checked ? "bg-background border-background" : "border-current"}`}>
                    {checked && <span className="w-2 h-2 rounded-[1px] bg-foreground" />}
                  </span>
                  <span className="truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      {clusters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {clusters.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background">
              <div>
                <p className="text-sm font-body font-medium">{c.name}</p>
                <p className="text-[11px] text-muted-foreground font-body">
                  {c.stationIds.map((id) => data.stations.find((s) => s.id === id)?.name).filter(Boolean).join(", ")}
                </p>
              </div>
              {canManage && (
                <ConfirmDeleteDialog
                  onConfirm={() => removeCluster(c.id)}
                  trigger={
                    <button className="p-1.5 rounded-md hover:bg-muted text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}