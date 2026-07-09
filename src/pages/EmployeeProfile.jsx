import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees, hasHRPermission } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";
import { ArrowLeft } from "lucide-react";
import ProfessionalInfoTab from "@/components/employees/ProfessionalInfoTab";
import CertificatesTab from "@/components/employees/CertificatesTab";
import SalaryTab from "@/components/employees/SalaryTab";
import LeaveTab from "@/components/employees/LeaveTab";

const TABS = ["professionalInfo", "certificates", "salary", "leave"];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-medium text-lg">{employee.name.charAt(0)}</div>
          <div>
            <h1 className="font-heading text-2xl font-semibold">{employee.name}</h1>
            <p className="text-muted-foreground font-body text-sm">{employee.customTitle || getRoleLabel(company, employee.role, t)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3.5 py-2 rounded-md text-sm font-body ${tab === tb ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t(tb)}
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