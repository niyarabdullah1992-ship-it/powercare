import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Plus } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { hrScopeStations, isCompanyOwner, isHRManager } from "@/lib/permissions";
import { canAddEmployee } from "@/lib/planLimits";
import StationMemberForm from "@/components/hr/StationMemberForm";
import StationTeamRoster from "@/components/hr/StationTeamRoster";

export default function StationTeamManagement() {
  const { stationId } = useParams();
  const { data, company, currentUser } = useAuth();
  const { lang } = useI18n();
  const [adding, setAdding] = useState(false);
  if (!data || !currentUser) return null;
  const ar = lang === "ar";
  const station = (data.stations || []).find((item) => item.id === stationId);
  if (!station) return <div className="rounded-xl border border-border bg-card p-8 text-center"><p>{ar ? "المحطة غير موجودة" : "Station not found"}</p><Link to="/app/hr" className="mt-3 inline-block text-accent">{ar ? "العودة" : "Go back"}</Link></div>;
  const scope = hrScopeStations(currentUser, data);
  const canManage = isCompanyOwner(currentUser, data) || (isHRManager(currentUser, data) && (scope === null || scope.includes(stationId) || (currentUser.managedStations || []).includes(stationId)));
  const team = (data.employees || []).filter((employee) => employee.stationId === stationId || (employee.managedStations || []).includes(stationId));
  const limitReached = !canAddEmployee(company, data);
  return <div className="space-y-6">
    <Link to="/app/hr" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className={`h-4 w-4 ${ar ? "rotate-180" : ""}`} />{ar ? "العودة إلى الهيكل" : "Back to organization tree"}</Link>
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/30 bg-card p-5"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-accent"><Building2 className="h-5 w-5" /></span><div><h1 className="font-heading text-3xl font-semibold">{station.name}</h1><p className="text-sm text-muted-foreground">{station.location || (ar ? "إدارة فريق المحطة" : "Station team management")}</p></div></div>{canManage && !limitReached && <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة عضو" : "Add member"}</button>}</header>
    {canManage && limitReached && <p className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">{ar ? "تم الوصول إلى حد الموظفين في الخطة الحالية" : "The employee limit for the current plan has been reached"}</p>}
    {adding && <StationMemberForm company={company} data={data} station={station} lang={lang} onDone={() => setAdding(false)} />}
    <StationTeamRoster team={team} levels={data.hrLevels || []} lang={lang} />
  </div>;
}