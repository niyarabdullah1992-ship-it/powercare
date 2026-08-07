import React from "react";
import ProfileMetricStrip from "@/components/employees/ProfileMetricStrip";
import JobDataCard from "@/components/employees/overview/JobDataCard";
import SalaryBreakdownCard from "@/components/employees/overview/SalaryBreakdownCard";
import LeaveHistoryCard from "@/components/employees/overview/LeaveHistoryCard";
import DocumentsCard from "@/components/employees/overview/DocumentsCard";
import useEmployeeProfileMetrics from "@/hooks/useEmployeeProfileMetrics";
import { getRun, monthKey, netOf } from "@/lib/payroll";

// نظرة عامة على ملف الموظف: أرقامه الحيّة وبياناته الوظيفية والمالية والمستندات.
export default function ProfileOverviewTab({ employee, data, company, currentUser, managerName, showSalary, ar, t }) {
  const { openTasks, todayAttendance } = useEmployeeProfileMetrics(company, currentUser, employee.id);
  const month = monthKey();
  const item = (getRun(data, month)?.items || []).find((entry) => entry.employeeId === employee.id);
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <ProfileMetricStrip
        openTasks={openTasks}
        todayAttendance={todayAttendance}
        points={employee.points}
        netSalary={showSalary && item ? netOf(item) : null}
        currency={item?.currency || employee.profile?.currency || "SAR"}
        monthLabel={monthLabel}
        ar={ar}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <JobDataCard employee={employee} managerName={managerName} ar={ar} />
        {showSalary && <SalaryBreakdownCard profile={employee.profile || {}} ar={ar} />}
        <LeaveHistoryCard requests={employee.leaveRequests} ar={ar} t={t} />
        <DocumentsCard employee={employee} ar={ar} />
      </div>
    </div>
  );
}