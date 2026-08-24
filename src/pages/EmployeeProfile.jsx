import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  canManageEmployees,
  hasHRPermission,
  canViewEmployeeProfile,
  isCompanyOwner,
  canAdjustPayroll,
  canManageEmployeeHR,
  canManageEmployeeContract,
  canManageEmployeeCommunication,
} from "@/lib/permissions";
import { getRoleLabel } from "@/lib/roles";
import { Lock } from "lucide-react";
import ProfileHero from "@/components/employees/ProfileHero";
import ProfileCompletionCard, { profileCompletionStats } from "@/components/employees/ProfileCompletionCard";
import ProfessionalInfoTab from "@/components/employees/ProfessionalInfoTab";
import CertificatesTab from "@/components/employees/CertificatesTab";
import SalaryTab from "@/components/employees/SalaryTab";
import LeaveTab from "@/components/employees/LeaveTab";
import HRCommunicationsTab from "@/components/employees/HRCommunicationsTab";
import ContractTab from "@/components/employees/ContractTab";
import LoginAccessCard from "@/components/employees/LoginAccessCard";
import AccountSettingsCard from "@/components/employees/AccountSettingsCard";
import DeleteEmployeeAccountCard from "@/components/employees/DeleteEmployeeAccountCard";
import OffboardingTab from "@/components/employees/OffboardingTab";
import EmpPointsTab from "@/components/employees/EmpPointsTab";
import EmpAlertsStrip from "@/components/employees/EmpAlertsStrip";
import AssignmentTab from "@/components/employees/AssignmentTab";
import { employeeJobGrade, gradesForList, orderedJobGrades } from "@/lib/jobGrades";
import { BORDER, CARD, MUTED, NAVY, cardShell, ui } from "@/lib/platformStyles";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/** Primary file tabs — MHRSD order: identity register → contract → wage → leave → certs → org. */
const TABS = [
  { key: "professionalInfo", ar: "ملف الموظف", en: "Employee file" },
  { key: "contract", ar: "عقد العمل", en: "Contract" },
  { key: "salary", ar: "الأجر", en: "Wage" },
  { key: "leave", ar: "الإجازات", en: "Leave" },
  { key: "certificates", ar: "الشهادات", en: "Certifications" },
  { key: "assignment", ar: "الإسناد", en: "Assignment" },
];

export default function EmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, dir, lang } = useI18n();
  const ar = lang === "ar" || dir === "rtl";
  const { data, currentUser, company } = useAuth();
  const wantComplete = searchParams.get("complete") === "1";
  const [tab, setTab] = useState("professionalInfo");
  const [autoEdit, setAutoEdit] = useState(wantComplete);

  if (!data || !currentUser) return null;
  const employee = (data.employees || []).find((e) => e.id === employeeId);
  if (!employee) {
    return (
      <p style={{ padding: "24px", fontSize: "13px", color: MUTED }}>—</p>
    );
  }

  const isSelf = currentUser.id === employee.id;
  const canDeleteAccount = !isSelf && employee.id !== data.ownerId && (isCompanyOwner(currentUser, data) || !!currentUser.hrLevelId);

  if (!canViewEmployeeProfile(currentUser, employee, data)) {
    return (
      <div style={{
        maxWidth: "440px",
        margin: "64px auto",
        textAlign: "center",
        padding: "28px 24px",
        borderRadius: "16px",
        border: `1px solid ${BORDER}`,
        background: CARD,
      }}
      >
        <Lock style={{ width: 28, height: 28, margin: "0 auto 12px", color: MUTED }} />
        <p style={{ margin: 0, fontWeight: 600, color: NAVY }}>{t("confidential")}</p>
        <p style={{ margin: "10px 0 0", fontSize: "13px", color: MUTED, lineHeight: 1.7 }}>
          {ar
            ? "هذا الملف الشخصي خاص — يمكنك فقط عرض ملفك الشخصي. بيانات الزملاء متاحة لمديريهم وللموارد البشرية."
            : "This profile is private — you can only view your own profile. Colleagues' data is available to their managers and HR."}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginTop: "16px",
            background: "none",
            border: "none",
            color: MUTED,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("back")}
        </button>
      </div>
    );
  }

  const canManageHRProfile = canManageEmployeeHR(currentUser, employee, data);
  const canManage = canManageEmployees(currentUser) || currentUser.role === "director" || currentUser.role === "ops_manager" || canManageHRProfile;
  const canEditGrade = isCompanyOwner(currentUser, data) || currentUser.role === "director" || hasHRPermission(currentUser, data, "manage_employees") || canManageHRProfile;
  const canEditSalary = canAdjustPayroll(currentUser, data);
  const canApproveLeave = canManage || hasHRPermission(currentUser, data, "manage_leave");
  const canApproveCerts = canManage || hasHRPermission(currentUser, data, "manage_leave");
  const canEditContract = canManageEmployeeContract(currentUser, employee, data);
  const canReplyCommunication = canManageEmployeeCommunication(currentUser, employee, data);
  const stationName = (data.stations || []).find((s) => s.id === employee.stationId)?.name;
  const fallbackPosition = employee.customTitle || getRoleLabel(company, employee.role, t);
  const grade = employeeJobGrade(employee, data);

  const sections = TABS.map((tb) => ({
    value: tb.key,
    label: ar ? tb.ar : tb.en,
  }));

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "ملف الموظف" : "Employee file"}
      hint={ar
        ? "الهوية ثم العقد ثم الأجر ثم الإجازة ثم الشهادات — نفس سلسلة الإثبات."
        : "Identity, then contract, then wage, then leave, then certificates — the same proof chain."}
      sections={sections}
      tool={tab}
      onTool={setTab}
      meta={(
        <button
          type="button"
          onClick={() => navigate("/app/hr")}
          style={{ ...ui.btnGhost, display: "flex", alignItems: "center", gap: "7px" }}
        >
          {ar ? "رجوع إلى الدليل" : "Back to directory"}
        </button>
      )}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ProfileHero
        employee={employee}
        companyId={company.id}
        canEdit={isSelf || canManage}
        roleLabel={employee.profile?.position || fallbackPosition}
        grade={grade}
        stationName={stationName}
      />

      <EmpAlertsStrip employee={employee} lang={lang} />

      {!profileCompletionStats(employee).done && (
        <ProfileCompletionCard
          employee={employee}
          isSelf={isSelf}
          ar={ar}
          onContinue={() => {
            setTab("professionalInfo");
            setAutoEdit(canManage);
            if (wantComplete) {
              searchParams.delete("complete");
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
      )}

      {tab === "assignment" && (
        <AssignmentTab
          employee={employee}
          companyId={company.id}
          lang={lang}
          canManage={canManage && !isSelf}
          stations={data.stations || []}
          currentUser={currentUser}
        />
      )}
      {tab === "professionalInfo" && (
        <ProfessionalInfoTab
          employee={employee}
          companyId={company.id}
          canEdit={canManage}
          isSelf={isSelf}
          canEditGrade={canEditGrade}
          grades={(() => {
            const listId = (data.smartPositions || []).find((item) => item.employeeId === employee.id)?.templateId
              || employee.profile?.listId
              || "";
            return listId ? gradesForList(data, listId) : orderedJobGrades(data);
          })()}
          fallbackPosition={fallbackPosition}
          stationName={stationName}
          autoEdit={autoEdit}
        />
      )}
      {tab === "certificates" && (
        <CertificatesTab
          employee={employee}
          companyId={company.id}
          canEdit={isSelf || canManage}
          canApprove={canApproveCerts}
          currentUser={currentUser}
        />
      )}
      {tab === "salary" && (
        <SalaryTab employee={employee} companyId={company.id} canEdit={canEditSalary} />
      )}
      {tab === "leave" && (
        <LeaveTab
          employee={employee}
          companyId={company.id}
          currentUser={currentUser}
          isSelf={isSelf}
          canApprove={canApproveLeave}
        />
      )}
      {tab === "contract" && (
        <ContractTab employee={employee} companyId={company.id} canEdit={canEditContract} />
      )}

      <details style={{ ...cardShell, padding: "14px 18px" }}>
        <summary style={{
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          color: NAVY,
          listStyle: "none",
        }}
        >
          {ar ? "السجل التأديبي والتواصل" : "Disciplinary record and communications"}
        </summary>
        <div style={{ marginTop: "14px" }}>
          <HRCommunicationsTab
            employee={employee}
            companyId={company.id}
            currentUser={currentUser}
            isSelf={isSelf}
            canReply={canReplyCommunication}
            data={data}
          />
        </div>
      </details>

      <details style={{ ...cardShell, padding: "14px 18px" }}>
        <summary style={{
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          color: NAVY,
          listStyle: "none",
        }}
        >
          {ar ? "نهاية الخدمة — المادة 84" : "End of service — Article 84"}
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
          <EmpPointsTab employee={employee} data={data} lang={lang} />
          <OffboardingTab
            employee={employee}
            companyId={company.id}
            currentUser={currentUser}
            canManage={canManage && !isSelf}
          />
        </div>
      </details>

      {(isSelf || (canManage && !isSelf) || canDeleteAccount) && (
        <details style={{ ...cardShell, padding: "14px 18px" }}>
          <summary style={{
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: NAVY,
            listStyle: "none",
          }}
          >
            {ar ? "إعدادات الحساب والدخول" : "Account and sign-in settings"}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
            {isSelf && <AccountSettingsCard employee={employee} company={company} />}
            {canManage && !isSelf && <LoginAccessCard employee={employee} companyId={company.id} />}
            {canDeleteAccount && <DeleteEmployeeAccountCard employee={employee} companyId={company.id} />}
          </div>
        </details>
      )}
      </div>
    </PlatformStampShell>
  );
}
