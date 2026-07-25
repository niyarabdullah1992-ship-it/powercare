import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Banknote, Users, CheckCircle2, Wallet, RefreshCw, FileText } from "lucide-react";
import { ensurePayrollRun, getRun, isPayrollEmployee, monthKey, netOf, payrollItemIssues, setOwnerPayrollEnabled, updatePayrollItem, setItemPaid, syncPayrollFromProfiles } from "@/lib/payroll";
import { printReport } from "@/lib/printReport";
import PayrollTableRows from "@/components/payroll/PayrollTableRows";
import PayrollReportExport from "@/components/payroll/PayrollReportExport";
import StationMultiSelect from "@/components/payroll/StationMultiSelect";
import PayrollSalaryNotice from "@/components/payroll/PayrollSalaryNotice";
import OwnerPayrollToggle from "@/components/payroll/OwnerPayrollToggle";
import { canAdjustPayroll, hrScopeStations } from "@/lib/permissions";
import { toast } from "@/components/ui/use-toast";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import PageHeader from "@/components/PageHeader";

const UNASSIGNED_STATION_ID = "__unassigned__";

export default function Payroll() {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [month, setMonth] = useState(monthKey());
  const [stationFilter, setStationFilter] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const canView = canAdjustPayroll(currentUser, data);
  const includeOwner = data?.settings?.includeOwnerInPayroll === true;

  useEffect(() => {
    if (canView && company) ensurePayrollRun(company.id, month);
  }, [company?.id, month, canView, includeOwner]);

  if (!canView) {
    return <p className="text-sm text-muted-foreground font-body py-10 text-center">{ar ? "هذا القسم متاح للإدارة العليا فقط." : "This section is available to executive management only."}</p>;
  }

  const run = getRun(data, month);
  const items = run?.items || [];
  const payrollScope = currentUser?.hrLevelId
    ? hrScopeStations(currentUser, data)
    : currentUser?.role === "pgm" ? (currentUser.managedStations || []) : null;
  const stationIdOf = (stationId) => stationId || null;
  const employeeStationId = (employee) => stationIdOf(stationIdForTreeEmployee(data, employee.id) || employee.stationId);
  const payrollEmployees = (data.employees || []).filter((employee) => isPayrollEmployee(employee, includeOwner) && (payrollScope === null || payrollScope.includes(employeeStationId(employee))));
  const ownerIds = new Set(includeOwner ? [] : (data.employees || []).filter((employee) => employee.role === "owner").map((employee) => employee.id));
  const employeeForItem = (item) => payrollEmployees.find((employee) => employee.id === item.employeeId) || {
    id: item.employeeId,
    name: item.employeeName || (ar ? "موظف سابق" : "Former employee"),
    position: item.employeePosition || "",
    stationId: stationIdOf(item.employeeStationId),
  };
  const itemStationId = (item) => {
    const employee = (data.employees || []).find((entry) => entry.id === item.employeeId);
    return employee ? employeeStationId(employee) : stationIdOf(item.employeeStationId);
  };
  const allowedStations = (data.stations || []).filter((station) => payrollScope === null || payrollScope.includes(station.id));
  const filterStations = [...allowedStations, { id: UNASSIGNED_STATION_ID, name: ar ? "غير مخصص" : "Unassigned" }];
  const allowedStationIds = new Set(filterStations.map((station) => station.id));
  const selectedStationIds = stationFilter.filter((id) => allowedStationIds.has(id));
  const scopedItems = items.filter((item) => !ownerIds.has(item.employeeId) && (payrollEmployees.some((employee) => employee.id === item.employeeId) || (item.employeeName && (payrollScope === null || payrollScope.includes(itemStationId(item))))));
  const visible = selectedStationIds.length === 0 ? scopedItems : scopedItems.filter((item) => selectedStationIds.includes(itemStationId(item) || UNASSIGNED_STATION_ID));
  const selectedStationNames = filterStations.filter((station) => selectedStationIds.includes(station.id)).map((station) => station.name);
  const stationLabel = selectedStationNames.length ? selectedStationNames.join(", ") : (ar ? "جميع المحطات" : "All stations");
  const currency = visible[0]?.currency || "SAR";
  const totalNet = visible.reduce((s, i) => s + netOf(i), 0);
  const paidCount = visible.filter((i) => i.paid).length;
  const branding = data.reportBranding || {};
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });

  const headers = ar
    ? ["الموظف", "الأساسي", "البدلات", "مكافآت", "خصومات", "الصافي", "الحالة"]
    : ["Employee", "Base", "Allowances", "Bonus", "Deductions", "Net", "Status"];

  const syncFromProfiles = () => {
    const confirmed = window.confirm(ar
      ? "سيتم تحديث الراتب الأساسي والبدلات والعملة للموظفين غير المدفوعين فقط. هل تريد المتابعة؟"
      : "Base salary, allowances, and currency will be refreshed for unpaid employees only. Continue?");
    if (!confirmed) return;
    const count = syncPayrollFromProfiles(company.id, month);
    toast({
      title: ar ? "تم تحديث بيانات الرواتب" : "Payroll data refreshed",
      description: ar ? `تم تحديث بيانات ${count} موظف.` : `${count} employee profiles were updated.`,
    });
  };

  const exportPayslip = (item) => {
    const e = employeeForItem(item);
    printReport({
      title: ar ? "قسيمة راتب" : "Payslip",
      companyName: company.name, periodLabel: `${e?.name || ""} — ${monthLabel}`, dir,
      logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f",
      stats: [{ value: `${netOf(item).toLocaleString()} ${item.currency}`, label: ar ? "صافي الراتب" : "Net salary" }],
      sections: [{
        heading: ar ? "تفاصيل الراتب" : "Salary breakdown",
        headers: ar ? ["البند", "المبلغ"] : ["Item", "Amount"],
        rows: [
          [ar ? "الراتب الأساسي" : "Base salary", `${Number(item.base).toLocaleString()} ${item.currency}`],
          [ar ? "البدلات" : "Allowances", `${Number(item.allowances).toLocaleString()} ${item.currency}`],
          [ar ? "المكافآت" : "Bonus", `${Number(item.bonus).toLocaleString()} ${item.currency}`],
          [ar ? "الخصومات" : "Deductions", `- ${Number(item.deductions).toLocaleString()} ${item.currency}`],
          [ar ? "الصافي" : "Net", `${netOf(item).toLocaleString()} ${item.currency}`],
          [ar ? "حالة الدفع" : "Payment status", item.paid ? (ar ? "مدفوع" : "Paid") : (ar ? "غير مدفوع" : "Unpaid")],
        ],
      }],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "الرواتب" : "Payroll"}
        description={ar ? "مسيّر رواتب شهري مبني على ملفات الموظفين" : "Monthly payroll run built from employee salary profiles"}
        icon={Banknote}
        actions={<>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground" dir="ltr" />
          <StationMultiSelect stations={filterStations} value={selectedStationIds} onChange={setStationFilter} ar={ar} />
          <button onClick={syncFromProfiles} className="flex items-center gap-1.5 border border-accent/45 bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تحديث من الملفات الشخصية" : "Refresh from profiles"}
          </button>
        </>}
      />

      <OwnerPayrollToggle checked={includeOwner} onChange={(checked) => setOwnerPayrollEnabled(company.id, checked)} ar={ar} />

      <PayrollSalaryNotice ar={ar} />

      <div className="space-y-3">
        <button type="button" onClick={() => setShowReport((value) => !value)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-body ${showReport ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}>
          <FileText className="h-4 w-4" /> {ar ? "تقرير الرواتب (PDF / Excel)" : "Payroll report (PDF / Excel)"}
        </button>
        {showReport && <PayrollReportExport runs={data.payrollRuns || []} employees={payrollEmployees} excludedEmployeeIds={ownerIds} stations={allowedStations} companyName={company.name} branding={branding} lang={lang} dir={dir} />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          [Users, visible.length, ar ? "الموظفون" : "Employees"],
          [Wallet, `${totalNet.toLocaleString()} ${currency}`, ar ? "إجمالي الصافي" : "Total net"],
          [CheckCircle2, `${paidCount}/${visible.length}`, ar ? "تم الدفع" : "Paid"],
        ].map(([Icon, value, label]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold truncate" dir="ltr">{value}</p>
              <p className="text-[11px] text-muted-foreground font-body">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-5 overflow-x-auto">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body py-8 text-center">
            {ar ? "لا يوجد موظفون بعد — أضف موظفين وحدّد رواتبهم من ملفاتهم الشخصية (تبويب الراتب)." : "No employees yet — add employees and set their salaries from their profiles (Salary tab)."}
          </p>
        ) : (
          <table className="w-full min-w-[830px] table-fixed mobile-cards">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[110px]" />
              <col className="w-[70px]" />
            </colgroup>
            <thead>
              <tr>
                {[...headers, ar ? "قسيمة" : "Payslip"].map((h) => (
                  <th key={h} className="px-2 pb-3 text-center text-[11px] font-body font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <PayrollTableRows
                items={visible}
                stations={allowedStations}
                getStationId={itemStationId}
                employeeForItem={employeeForItem}
                ar={ar}
                onChange={(itemId, field, value) => updatePayrollItem(company.id, month, itemId, { [field]: value })}
                onTogglePaid={(item, paid) => {
                  if (paid && payrollItemIssues(item).length) {
                    alert(ar ? "لا يمكن اعتماد الدفع قبل إدخال راتب أساسي ومبالغ صحيحة وصافي موجب وعملة صالحة." : "Payment cannot be approved until base salary, valid amounts, a positive net, and a valid currency are set.");
                    return;
                  }
                  setItemPaid(company.id, month, item.id, paid);
                }}
                onPayslip={exportPayslip}
              />
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}