import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { Plus } from "lucide-react";
import HRNode from "@/components/hr/HRNode";
import AddHRModal from "@/components/hr/AddHRModal";

export default function HRStationCard({ station, data, currentUser, canAssign }) {
  const { t } = useI18n();
  const [showAssign, setShowAssign] = useState(false);
  const levels = data.hrLevels || [];
  const topHR = data.employees.find((e) => e.hrStationId === station.id);
  const stationTeam = data.employees.filter((e) => e.stationId === station.id && !e.hrLevelId);

  const assign = (empId, levelId) => {
    const lvl = levels.find((l) => l.id === levelId);
    if (lvl?.maxCount && data.employees.filter((e) => e.hrLevelId === levelId).length >= lvl.maxCount) {
      alert(t("levelFull"));
      return;
    }
    updateCompany(data.id, (d) => {
      const emp = d.employees.find((x) => x.id === empId);
      if (!emp) return;
      emp.hrLevelId = levelId;
      emp.hrParentId = null;
      emp.hrStationId = station.id;
    });
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-semibold">{station.name}</h4>
        {!topHR && canAssign && (
          <button onClick={() => setShowAssign(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <Plus className="w-3.5 h-3.5" /> {t("assignHR")}
          </button>
        )}
      </div>

      {topHR ? (
        <HRNode employee={topHR} allEmployees={data.employees} levels={levels} stations={data.stations} companyId={data.id} currentUser={currentUser} />
      ) : (
        <p className="text-sm text-muted-foreground font-body">{t("noHRAssigned")}</p>
      )}

      {showAssign && (
        <AddHRModal
          title={t("assignHR")}
          employees={stationTeam}
          levels={levels}
          onAdd={assign}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}