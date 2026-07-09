import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// Director-only: define clusters (named groups of stations) used by Tier 2 HR assignment.
export default function ClusterEditor({ data, canManage }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [stationIds, setStationIds] = useState([]);
  const clusters = data.hrClusters || [];

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
          <div className="flex flex-wrap gap-2">
            {data.stations.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={stationIds.includes(s.id)}
                  onChange={(e) => setStationIds(e.target.checked ? [...stationIds, s.id] : stationIds.filter((id) => id !== s.id))}
                />
                {s.name}
              </label>
            ))}
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