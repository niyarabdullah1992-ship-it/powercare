import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

// Create a new SimDif position node: its name, operational scope, and where it
// reports to in the tree.
export default function SimDifAddNodeModal({ data, nodes, onClose, onCreate }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("station");
  const [scopeTargetId, setScopeTargetId] = useState("");
  const [parentId, setParentId] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), scope, scopeTargetId: scope === "global" ? null : scopeTargetId || null, parentId: parentId || null });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{t("addNode")}</h3>
        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("nodeName")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("positionScope")}</label>
          <select value={scope} onChange={(e) => { setScope(e.target.value); setScopeTargetId(""); }} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
            <option value="station">{t("scopeStation")}</option>
            <option value="cluster">{t("scopeCluster")}</option>
            <option value="global">{t("scopeGlobal")}</option>
          </select>
        </div>
        {scope === "station" && (
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("selectStation")}</label>
            <select value={scopeTargetId} onChange={(e) => setScopeTargetId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
              <option value="">—</option>
              {(data.stations || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        {scope === "cluster" && (
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("clusterName")}</label>
            <select value={scopeTargetId} onChange={(e) => setScopeTargetId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
              <option value="">—</option>
              {(data.hrClusters || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("selectParent")}</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
            <option value="">{t("noParentOption")}</option>
            {(nodes || []).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}