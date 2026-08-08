import React from "react";
import { Inbox } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PageHeader from "@/components/PageHeader";
import HRRequestsPanel from "@/components/hr/HRRequestsPanel";
import LeaveBalancesTable from "@/components/hr/LeaveBalancesTable";

// Central approvals inbox + company-wide leave balances.
export default function LeaveRequests() {
  const { lang } = useI18n();
  const { data, company, currentUser } = useAuth();
  const ar = lang === "ar";

  if (!data || !currentUser || !company) return null;

  return (
    <div className="space-y-6">
      <PageHeader title={ar ? "الإجازات والطلبات" : "Leaves & Requests"} icon={Inbox} />
      <HRRequestsPanel data={data} companyId={company.id} currentUser={currentUser} ar={ar} />
      <LeaveBalancesTable employees={data.employees || []} ar={ar} />
    </div>
  );
}