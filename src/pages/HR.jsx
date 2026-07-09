import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageHRLevels, canManageEmployees } from "@/lib/permissions";
import { updateCompany } from "@/lib/store";
import HRLevelsManager from "@/components/hr/HRLevelsManager";
import HRStationCard from "@/components/hr/HRStationCard";
import { Layers, Building2 } from "lucide-react";

const SUGGESTED_LEVELS = [
  { name: "مسؤول الموارد البشرية العام", permissions: ["view_employees", "manage_employees", "manage_leave", "manage_anonymous_reports", "manage_payroll"] },
  { name: "مسؤول موارد بشرية إقليمي", permissions: ["view_employees", "manage_employees", "manage_leave", "view_safety"] },
  { name: "مسؤول موارد بشرية المحطة", permissions: ["view_employees", "view_reports", "view_safety", "manage_anonymous_reports"] },
];

export default function HR() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  const canSeeLevels = data && currentUser && canManageHRLevels(currentUser);
  const [tab, setTab] = useState("stations");

  useEffect(() => {
    if (data && canSeeLevels && (data.hrLevels || []).length === 0) {
      updateCompany(data.id, (d) => {
        d.hrLevels = SUGGESTED_LEVELS.map((l) => ({
          id: "hrl_" + Math.random().toString(36).slice(2, 9),
          name: l.name,
          permissions: l.permissions,
          maxCount: null,
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const canAssign = canManageEmployees(currentUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      {canSeeLevels && (
        <div className="flex gap-2 border-b border-border">
          <TabButton active={tab === "stations"} onClick={() => setTab("stations")} icon={Building2} label={t("stations")} />
          <TabButton active={tab === "levels"} onClick={() => setTab("levels")} icon={Layers} label={t("hrLevels")} />
        </div>
      )}

      {(!canSeeLevels || tab === "levels") && canSeeLevels && <HRLevelsManager data={data} />}

      {(!canSeeLevels || tab === "stations") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HRStationCard station={null} data={data} currentUser={currentUser} canAssign={canAssign} />
          {stations.map((s) => (
            <HRStationCard key={s.id} station={s} data={data} currentUser={currentUser} canAssign={canAssign} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body border-b-2 -mb-px transition ${
        active ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}