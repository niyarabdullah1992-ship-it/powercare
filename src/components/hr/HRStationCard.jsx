import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { Plus } from "lucide-react";
import HRNode from "@/components/hr/HRNode";
import AddHRModal from "@/components/hr/AddHRModal";

// station=null means company-wide HR (not tied to any station).
export default function HRStationCard({ station, data, currentUser, canAssign }) {
  const { t } = useI18n();
  const [showAssign, setShowAssign] = useState(false);
  const levels = data.hrLevels || [];
  const stationId = station ? station.id : null;
  const topHRs = data.employees.filter((e) => e.hrLevelId && !e.hrParentId && (e.hrStationId || null) === stationId);
  const stationTeam = data.employees.filter((e) => !e.hrLevelId);

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
      emp.hrStationId = stationId;
    });
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-semibold">{station ? station.name : t("companyWide")}</h4>
        {canAssign && (
          levels.length > 0 ? (
            <button onClick={() => setShowAssign(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              <Plus className="w-3.5 h-3.5" /> {t("assignHR")}
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground font-body italic">{t("noLevels")}</span>
          )
        )}
      </div>

      {topHRs.length > 0 ? (
        <div className="space-y-2">
          {topHRs.map((hr) => (
            <HRNode key={hr.id} employee={hr} allEmployees={data.employees} levels={levels} stations={data.stations} companyId={data.id} currentUser={currentUser} />
          ))}
        </div>
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