import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageHRLevels, canManageEmployees } from "@/lib/permissions";
import { updateCompany } from "@/lib/store";
import HRStationCard from "@/components/hr/HRStationCard";

const SUGGESTED_LEVELS = [
  { name: "رئيس الموارد البشرية", scope: "company", permissions: ["view_employees", "manage_employees", "manage_leave", "manage_anonymous_reports", "manage_payroll", "view_reports", "view_safety"] },
  { name: "نائب رئيس الموارد البشرية", scope: "company", permissions: ["view_employees", "manage_employees", "manage_leave", "view_reports", "view_safety"] },
  { name: "مسؤول موارد بشرية المحطة", scope: "station", permissions: ["view_employees", "view_reports", "view_safety", "manage_anonymous_reports"] },
];
const HR_SCHEMA_VERSION = 3;

export default function HR() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  const canSeeLevels = data && currentUser && canManageHRLevels(currentUser);

  useEffect(() => {
    if (data && canSeeLevels && data.hrSchemaVersion !== HR_SCHEMA_VERSION) {
      updateCompany(data.id, (d) => {
        d.hrLevels = SUGGESTED_LEVELS.map((l) => ({
          id: "hrl_" + Math.random().toString(36).slice(2, 9),
          name: l.name,
          scope: l.scope,
          permissions: l.permissions,
          maxCount: null,
        }));
        d.employees.forEach((e) => {
          e.hrLevelId = null;
          e.hrParentId = null;
          e.hrStationId = null;
        });
        d.hrSchemaVersion = HR_SCHEMA_VERSION;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, currentUser?.id, canSeeLevels]);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const canAssign = canManageEmployees(currentUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HRStationCard station={null} data={data} currentUser={currentUser} canAssign={canAssign} />
        {stations.map((s) => (
          <HRStationCard key={s.id} station={s} data={data} currentUser={currentUser} canAssign={canAssign} />
        ))}
      </div>
    </div>
  );
}