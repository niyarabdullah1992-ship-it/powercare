import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { groupLevelsByOrder, levelName, MANAGER_PERMISSIONS, ASSISTANT_PERMISSIONS } from "@/lib/hrLevels";
import { addHRTier, renameHRLevel, removeHRTier, moveHRTier, toggleHRTierActive, setHRLevelPermissions, setHRTierStations } from "@/lib/store";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Power, ShieldCheck, MapPin, Info } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import HRPermissionsChecklist from "@/components/hr/HRPermissionsChecklist";
import StationPicker from "@/components/hr/StationPicker";

const SCOPES = ["station", "cluster", "company"];

// Lets any company build the HR hierarchy that fits them: add, rename, reorder,
// or delete positions — nothing about the tier structure is fixed anymore.
export default function HRTiersEditor({ data, canManage, canMultiStation }) {
  const { t, lang } = useI18n();
  const [adding, setAdding] = useState(false);
  const [scope, setScope] = useState("station");
  const [managerName, setManagerName] = useState("");
  const [includeAssistant, setIncludeAssistant] = useState(true);
  const [assistantName, setAssistantName] = useState("");
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [managerPerms, setManagerPerms] = useState(MANAGER_PERMISSIONS);
  const [assistantPerms, setAssistantPerms] = useState(ASSISTANT_PERMISSIONS);
  const [tierStationIds, setTierStationIds] = useState([]);
  const [permsLevelId, setPermsLevelId] = useState(null);
  const [permsValue, setPermsValue] = useState([]);
  const [stationsOrder, setStationsOrder] = useState(null);
  const [stationsValue, setStationsValue] = useState([]);

  const groups = groupLevelsByOrder(data.hrLevels || []).slice().reverse(); // highest authority first

  if (!canManage && groups.length === 0) return null;

  const scopeLabel = (s) => (s === "station" ? t("scopeStation") : s === "cluster" ? t("scopeCluster") : t("scopeCompany"));

  const submitAdd = (e) => {
    e.preventDefault();
    if (!managerName.trim()) return;
    addHRTier(data.id, {
      scope,
      managerName: managerName.trim(),
      includeAssistant,
      assistantName: includeAssistant ? assistantName.trim() : null,
      managerPermissions: managerPerms,
      assistantPermissions: assistantPerms,
      stationIds: tierStationIds,
    });
    setManagerName(""); setAssistantName(""); setIncludeAssistant(true); setScope("station"); setAdding(false);
    setManagerPerms(MANAGER_PERMISSIONS); setAssistantPerms(ASSISTANT_PERMISSIONS); setTierStationIds([]);
  };

  const startEdit = (level) => { setEditingLevelId(level.id); setEditValue(levelName(level, lang)); };
  const saveEdit = () => {
    if (editValue.trim()) renameHRLevel(data.id, editingLevelId, editValue.trim());
    setEditingLevelId(null); setEditValue("");
  };

  const startEditPerms = (level) => { setPermsLevelId(level.id); setPermsValue(level.permissions || []); };
  const savePerms = () => {
    setHRLevelPermissions(data.id, permsLevelId, permsValue);
    setPermsLevelId(null); setPermsValue([]);
  };

  const startEditStations = (g) => { setStationsOrder(g.order); setStationsValue(g.manager?.stationIds || g.assistant?.stationIds || []); };
  const saveStations = () => {
    setHRTierStations(data.id, stationsOrder, stationsValue);
    setStationsOrder(null); setStationsValue([]);
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-accent/25 bg-accent/5">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold font-body text-foreground">{t("hrExplainTitle")}</p>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5 leading-relaxed">{t("hrExplainText")}</p>
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground font-body">{t("positionsNote")}</p>
          <button onClick={() => setAdding((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> {t("addPosition")}
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={submitAdd} className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("positionScope")}</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
              {SCOPES.map((s) => <option key={s} value={s}>{scopeLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("station") || "Station"} ({t("leaveEmptyForAll") || "leave empty for all stations"})</label>
            <StationPicker
              stations={data.stations}
              selected={tierStationIds}
              t={t}
              onToggle={(id) => setTierStationIds((prev) => {
                const active = prev.includes(id);
                if (!canMultiStation) return active ? [] : [id]; // single station only, unless top HR position / owner
                return active ? prev.filter((sid) => sid !== id) : [...prev, id];
              })}
            />
          </div>
          <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder={t("managerPositionName")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          <label className="flex items-center gap-2 text-xs font-body">
            <input type="checkbox" checked={includeAssistant} onChange={(e) => setIncludeAssistant(e.target.checked)} />
            {t("includeAssistantPosition")}
          </label>
          {includeAssistant && (
            <input value={assistantName} onChange={(e) => setAssistantName(e.target.value)} placeholder={t("assistantPositionName")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          )}
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("hrManagerRole")} — {t("permissions") || "Permissions"}</label>
            <HRPermissionsChecklist value={managerPerms} onChange={setManagerPerms} />
          </div>
          {includeAssistant && (
            <div>
              <label className="block text-xs text-muted-foreground font-body mb-1">{t("hrAssistantRole")} — {t("permissions") || "Permissions"}</label>
              <HRPermissionsChecklist value={assistantPerms} onChange={setAssistantPerms} />
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body italic">{t("noPositions")}</p>
      ) : (
        <div className="space-y-2">
          {groups.map((g, idx) => {
            const isSuspended = [g.manager, g.assistant].some((l) => l?.active === false);
            return (
            <div key={g.order} className={`flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background ${isSuspended ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0 space-y-1.5">
                {isSuspended && (
                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-body bg-destructive/10 text-destructive">
                    {t("suspendedPosition") || "Suspended"}
                  </span>
                )}
                {[g.manager, g.assistant].filter(Boolean).map((level) => (
                  <div key={level.id} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-body shrink-0 ${level.role === "assistant" ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"}`}>
                      {level.role === "assistant" ? t("hrAssistantRole") : t("hrManagerRole")}
                    </span>
                    {editingLevelId === level.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus className="flex-1 px-2 py-1 rounded-md border border-input text-xs font-body" />
                        <button onClick={saveEdit} className="p-1 rounded hover:bg-muted text-accent"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingLevelId(null)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-body truncate">{levelName(level, lang)}</span>
                        {canManage && (
                          <>
                            <button onClick={() => startEdit(level)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => startEditPerms(level)} title={t("permissions") || "Permissions"} className="p-1 rounded hover:bg-muted text-muted-foreground"><ShieldCheck className="w-3 h-3" /></button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {[g.manager, g.assistant].filter(Boolean).map((level) => permsLevelId === level.id && (
                  <div key={`perms-${level.id}`} className="p-2 rounded-md border border-border bg-muted/30 space-y-2">
                    <p className="text-[10px] text-muted-foreground font-body">{levelName(level, lang)}</p>
                    <HRPermissionsChecklist value={permsValue} onChange={setPermsValue} />
                    <div className="flex gap-2">
                      <button onClick={savePerms} className="px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
                      <button onClick={() => setPermsLevelId(null)} className="px-2.5 py-1 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground font-body">
                  {(() => {
                    const sIds = g.manager?.stationIds || g.assistant?.stationIds || null;
                    if (sIds && sIds.length > 0) {
                      const names = sIds.map((id) => data.stations.find((s) => s.id === id)?.name).filter(Boolean).join(", ");
                      return `${scopeLabel(g.scope)} · ${names}`;
                    }
                    return scopeLabel(g.scope);
                  })()}
                </p>
                {stationsOrder === g.order && (
                  <div className="p-2 rounded-md border border-border bg-muted/30 space-y-2">
                    <StationPicker
                      stations={data.stations}
                      selected={stationsValue}
                      t={t}
                      onToggle={(id) => setStationsValue((prev) => {
                        const active = prev.includes(id);
                        if (!canMultiStation) return active ? [] : [id]; // single station only, unless top HR position / owner
                        return active ? prev.filter((sid) => sid !== id) : [...prev, id];
                      })}
                    />
                    <div className="flex gap-2">
                      <button onClick={saveStations} className="px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
                      <button onClick={() => setStationsOrder(null)} className="px-2.5 py-1 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
                    </div>
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEditStations(g)} title={t("station") || "Stations"} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                  <button disabled={idx === 0} onClick={() => moveHRTier(data.id, g.order, 1)} title={t("moveUp")} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button disabled={idx === groups.length - 1} onClick={() => moveHRTier(data.id, g.order, -1)} title={t("moveDown")} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleHRTierActive(data.id, g.order)}
                    title={isSuspended ? (t("activatePosition") || "Activate") : (t("suspendPosition") || "Suspend")}
                    className={`p-1 rounded hover:bg-muted ${isSuspended ? "text-accent" : "text-muted-foreground"}`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <ConfirmDeleteDialog
                    onConfirm={() => removeHRTier(data.id, g.order)}
                    trigger={
                      <button className="p-1 rounded hover:bg-muted text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}