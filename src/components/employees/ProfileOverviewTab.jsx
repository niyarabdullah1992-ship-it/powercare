import React from "react";
import ProfileRelatedLinks from "@/components/employees/ProfileRelatedLinks";
import JobDataCard from "@/components/employees/overview/JobDataCard";
import SalaryBreakdownCard from "@/components/employees/overview/SalaryBreakdownCard";
import LeaveHistoryCard from "@/components/employees/overview/LeaveHistoryCard";
import DocumentsCard from "@/components/employees/overview/DocumentsCard";

// نظرة عامة على ملف الموظف: بياناته الوظيفية والمالية وإجازاته ومستنداته.
export default function ProfileOverviewTab({ employee, managerName, showSalary, ar, t }) {
  return (
    <div className="space-y-4">
      <ProfileRelatedLinks ar={ar} />
      <div className="grid gap-4 lg:grid-cols-2">
        <JobDataCard employee={employee} managerName={managerName} ar={ar} />
        {showSalary && <SalaryBreakdownCard profile={employee.profile || {}} ar={ar} />}
        <LeaveHistoryCard requests={employee.leaveRequests} ar={ar} t={t} />
        <DocumentsCard employee={employee} ar={ar} />
      </div>
    </div>
  );
}