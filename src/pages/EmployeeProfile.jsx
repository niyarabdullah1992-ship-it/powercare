import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees, hasHRPermission } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";
import { ArrowLeft, Briefcase, Award, Wallet, CalendarDays, Mail, Building2 } from "lucide-react";
import ProfessionalInfoTab from "@/components/employees/ProfessionalInfoTab";
import CertificatesTab from "@/components/employees/CertificatesTab";
import SalaryTab from "@/components/employees/SalaryTab";
import LeaveTab from "@/components/employees/LeaveTab";

const TABS = [
  { key: "professionalInfo", icon: Briefcase },
  { key: "certificates", icon: Award },
  { key: "salary", icon: Wallet },
  { key: "leave", icon: CalendarDays },
];

export default function EmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [tab, setTab] = useState("professionalInfo");

  if (!data || !currentUser) return null;
  const employee = data.employees.find((e) => e.id === employeeId);
  if (!employee) return <p className="p-6 text-sm text-muted-foreground font-body">—</p>;

  const isSelf = currentUser.id === employee.id;
  const canManage = canManageEmployees(currentUser) || currentUser.role === "director" || currentUser.role === "ops_manager";
  const canEditSalary = currentUser.role === "director" || hasHRPermission(currentUser, data, "manage_payroll");
  const canApproveLeave = canManage || hasHRPermission(currentUser, data, "manage_leave");
  const stationName = data.stations.find((s) => s.id === employee.stationId)?.name;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
        <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
      </button>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-accent/25 via-accent/10 to-transparent" />
        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-heading font-medium text-3xl shadow-md ring-4 ring-card shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold truncate">{employee.name}</h1>
            <p className="text-accent font-body text-sm font-medium">{employee.customTitle || getRoleLabel(company, employee.role, t)}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
              {employee.email && (
                <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {employee.email}</span>
              )}
              {stationName && (
                <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {stationName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl border border-border bg-card">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body transition-colors ${
              tab === key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4" /> {t(key)}
          </button>
        ))}
      </div>

      {tab === "professionalInfo" && <ProfessionalInfoTab employee={employee} companyId={company.id} canEdit={canManage} />}
      {tab === "certificates" && <CertificatesTab employee={employee} companyId={company.id} canEdit={isSelf || canManage} />}
      {tab === "salary" && <SalaryTab employee={employee} companyId={company.id} canEdit={canEditSalary} />}
      {tab === "leave" && <LeaveTab employee={employee} companyId={company.id} currentUser={currentUser} isSelf={isSelf} canApprove={canApproveLeave} />}
    </div>
  );
}