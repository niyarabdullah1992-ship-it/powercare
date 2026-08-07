import React from "react";
import { Briefcase } from "lucide-react";
import OverviewCard, { OverviewRow } from "./OverviewCard";

// البيانات الوظيفية الأساسية للموظف.
export default function JobDataCard({ employee, managerName, ar }) {
  const profile = employee.profile || {};
  return (
    <OverviewCard title={ar ? "البيانات الوظيفية" : "Employment data"} icon={Briefcase}>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <OverviewRow label={ar ? "الرقم الوظيفي" : "Job number"} value={profile.jobNumber} dir="ltr" />
        <OverviewRow label={ar ? "تاريخ التعيين" : "Hire date"} value={profile.hireDate} dir="ltr" />
        <OverviewRow label={ar ? "نوع التعاقد" : "Contract type"} value={profile.contractType} />
        <OverviewRow label={ar ? "المدير المباشر" : "Direct manager"} value={managerName} />
        <OverviewRow label={ar ? "رقم الهوية / الإقامة" : "National ID"} value={profile.nationalId} dir="ltr" />
        <OverviewRow label={ar ? "الجنسية" : "Nationality"} value={profile.nationality} />
        <OverviewRow label={ar ? "رقم التأمينات" : "GOSI number"} value={profile.gosiNumber} dir="ltr" />
        <OverviewRow label={ar ? "التأمين الطبي" : "Medical insurance"} value={profile.medicalInsurance} />
      </div>
    </OverviewCard>
  );
}