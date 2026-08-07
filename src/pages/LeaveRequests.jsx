import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { setLeaveRequestStatus } from "@/lib/store";
import { computeDays } from "@/lib/leaveTypes";
import { generateAbsenceDeduction } from "@/lib/deductionGenerators";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";
import PageHeader from "@/components/PageHeader";
import HRRequestRow from "@/components/hr/requests/HRRequestRow";
import { CalendarDays, Search } from "lucide-react";

const TABS = ["pending", "approved", "rejected"];

// قسم مستقل: كل إجازات وطلبات الموظفين المرفوعة إلى الموارد البشرية.
export default function LeaveRequests() {
  const { t, dir } = useI18n();
  const ar = dir === "rtl";
  const { data, currentUser, company } = useAuth();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const all = [];
    for (const employee of data?.employees || []) {
      for (const request of employee.leaveRequests || []) all.push({ employee, request });
    }
    return all.sort((a, b) => String(b.request.createdAt || "").localeCompare(String(a.request.createdAt || "")));
  }, [data?.employees]);

  if (!data || !currentUser) return null;
  const canApprove = isCompanyOwner(currentUser, data) || canManageEmployees(currentUser) || hasHRPermission(currentUser, data, "manage_leave");

  const visible = rows.filter(({ employee, request }) =>
    (request.status || "pending") === tab &&
    (!query.trim() || employee.name?.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const decide = (employee, request, status) => {
    setLeaveRequestStatus(company.id, employee.id, request.id, status, currentUser.name);
    if (status === "approved" && request.type === "unpaid") {
      generateAbsenceDeduction(company.id, employee.id, request.id, request.days || computeDays(request.startDate, request.endDate), currentUser);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarDays}
        title={ar ? "الإجازات والطلبات" : "Leave & requests"}
        description={ar ? "طلبات الموظفين المرفوعة إلى الموارد البشرية" : "Employee requests raised to HR"}
      />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md border px-4 py-2 text-sm ${tab === key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}
          >
            {t(key)} ({rows.filter(({ request }) => (request.status || "pending") === key).length})
          </button>
        ))}
        <span className="relative ms-auto">
          <Search className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? "ابحث عن موظف…" : "Search employee…"}
            className="w-56 rounded-md border border-input py-2 text-sm ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
          />
        </span>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {ar ? "لا توجد طلبات في هذه الحالة." : "No requests in this state."}
          </p>
        ) : (
          visible.map(({ employee, request }) => (
            <HRRequestRow key={`${employee.id}_${request.id}`} employee={employee} request={request} canApprove={canApprove} onDecide={decide} ar={ar} t={t} />
          ))
        )}
      </div>
    </div>
  );
}