import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { assignStationManager } from "@/lib/store";
import { X, UserCog } from "lucide-react";
import StationPicker from "@/components/hr/StationPicker";

// Lets an owner/manager assign one employee as Station Manager for several stations at
// once — no need to move between stations one by one from the Employees page.
export default function StationManagerAssignModal({ company, data, initialStationId, onClose }) {
  const { t } = useI18n();
  const [employeeId, setEmployeeId] = useState("");
  const [stationIds, setStationIds] = useState(initialStationId ? [initialStationId] : []);

  const toggleStation = (id) => {
    setStationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    if (!employeeId || stationIds.length === 0) return;
    assignStationManager(company.id, employeeId, stationIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <UserCog className="w-4 h-4" /> {t("assignManager")}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("select")}</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
            <option value="">—</option>
            {data.employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-muted-foreground font-body">{t("stations")}</label>
            <button
              type="button"
              onClick={() => setStationIds(stationIds.length === data.stations.length ? [] : data.stations.map((s) => s.id))}
              className="text-[11px] text-accent font-body hover:underline"
            >
              {stationIds.length === data.stations.length ? t("deselectAllStations") : t("selectAllStations")}
            </button>
          </div>
          <StationPicker stations={data.stations} selected={stationIds} onToggle={toggleStation} t={t} />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={!employeeId || stationIds.length === 0} className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">
            {t("confirm")}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm font-body">{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}