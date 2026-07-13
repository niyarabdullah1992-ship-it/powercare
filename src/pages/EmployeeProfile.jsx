import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees, hasHRPermission, canViewEmployeeProfile, isCompanyOwner } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";
import { ArrowLeft, Briefcase, Award, Wallet, CalendarDays, MessageCircle, Lock } from "lucide-react";
import ProfileHero from "@/components/employees/ProfileHero";
import ProfessionalInfoTab from "@/components/employees/ProfessionalInfoTab";
import CertificatesTab from "@/components/employees/CertificatesTab";
import SalaryTab from "@/components/employees/SalaryTab";
import LeaveTab from "@/components/employees/LeaveTab";
import HRCommunicationsTab from "@/components/employees/HRCommunicationsTab";
import LoginAccessCard from "@/components/employees/LoginAccessCard";
import AccountSettingsCard from "@/components/employees/AccountSettingsCard";
import DeleteEmployeeAccountCard from "@/components/employees/DeleteEmployeeAccountCard";

const TABS = [
  { key: "professionalInfo", icon: Briefcase },
  { key: "certificates", icon: Award },
  { key: "salary", icon: Wallet },
  { key: "leave", icon: CalendarDays },
  { key: "communications", icon: MessageCircle },
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
  const canDeleteAccount = !isSelf && employee.id !== data.ownerId && (isCompanyOwner(currentUser, data) || !!currentUser.hrLevelId);

  // Privacy: full profiles (personal data, certificates, salary, leave) are only
  // visible to the employee themself, their managers, and in-scope HR.
  if (!canViewEmployeeProfile(currentUser, employee, data)) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-3 p-8 rounded-xl border border-border bg-card">
        <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="font-heading font-semibold">{t("confidential")}</p>
        <p className="text-sm text-muted-foreground font-body">
          {dir === "rtl"
            ? "هذا الملف الشخصي خاص — يمكنك فقط عرض ملفك الشخصي. بيانات الزملاء متاحة لمديريهم وللموارد البشرية."
            : "This profile is private — you can only view your own profile. Colleagues' data is available to their managers and HR."}
        </p>
        <button onClick={() => navigate(-1)} className="text-sm text-accent hover:underline font-body">{t("back")}</button>
      </div>
    );
  }

  const canManage = canManageEmployees(currentUser) || currentUser.role === "director" || currentUser.role === "ops_manager";
  const canEditSalary = currentUser.role === "director" || hasHRPermission(currentUser, data, "manage_payroll");
  const canApproveLeave = canManage || hasHRPermission(currentUser, data, "manage_leave");
  const canApproveCerts = canManage || hasHRPermission(currentUser, data, "manage_leave");
  const stationName = data.stations.find((s) => s.id === employee.stationId)?.name;
  const fallbackPosition = employee.customTitle || getRoleLabel(company, employee.role, t);

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:-m-8 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
        </button>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <main className="space-y-5 lg:col-start-1 lg:row-start-1">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-5">
              {TABS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-body transition-colors ${
                    tab === key ? "bg-accent text-accent-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {t(key)}
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-border bg-card p-4 md:p-6">
              {tab === "professionalInfo" && <ProfessionalInfoTab employee={employee} companyId={company.id} canEdit={canManage} fallbackPosition={fallbackPosition} />}
              {tab === "certificates" && <CertificatesTab employee={employee} companyId={company.id} canEdit={isSelf || canManage} canApprove={canApproveCerts} currentUser={currentUser} />}
              {tab === "salary" && <SalaryTab employee={employee} companyId={company.id} canEdit={canEditSalary} />}
              {tab === "leave" && <LeaveTab employee={employee} companyId={company.id} currentUser={currentUser} isSelf={isSelf} canApprove={canApproveLeave} />}
              {tab === "communications" && <HRCommunicationsTab employee={employee} companyId={company.id} currentUser={currentUser} isSelf={isSelf} canReply={canManage} />}
            </section>
          </main>

          <aside className="space-y-5 lg:col-start-2 lg:row-start-1">
            <ProfileHero
              employee={employee}
              companyId={company.id}
              canEdit={isSelf || canManage}
              roleLabel={employee.profile?.position || fallbackPosition}
              stationName={stationName}
            />
            {isSelf && <AccountSettingsCard employee={employee} company={company} />}
            {canManage && !isSelf && <LoginAccessCard employee={employee} companyId={company.id} />}
            {canDeleteAccount && <DeleteEmployeeAccountCard employee={employee} companyId={company.id} />}
          </aside>
        </div>
      </div>
    </div>
  );
}