// ERP export formats: builds employee & payroll files in the standard import
// layouts of SAP HCM, Oracle HCM Cloud and Odoo — downloadable as CSV (UTF-8 BOM).
import { netOf } from "@/lib/payroll";

export function downloadCsv(filename, headers, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const ERP_SYSTEMS = [
  { id: "sap", name: "SAP HCM / SuccessFactors" },
  { id: "oracle", name: "Oracle HCM Cloud" },
  { id: "odoo", name: "Odoo" },
];

const stationName = (data, id) => (data.stations || []).find((s) => s.id === id)?.name || "";

export function buildEmployeesExport(data, system) {
  const emps = data.employees || [];
  if (system === "sap") {
    return {
      headers: ["PERNR", "ENAME", "PLANS", "ORGEH", "USRID_LONG", "TEL_NUMBER"],
      rows: emps.map((e) => [e.id, e.name, e.position || e.role, stationName(data, e.stationId), e.email || "", e.phone || ""]),
    };
  }
  if (system === "oracle") {
    return {
      headers: ["PersonNumber", "DisplayName", "JobTitle", "Department", "WorkEmail", "PhoneNumber"],
      rows: emps.map((e) => [e.id, e.name, e.position || e.role, stationName(data, e.stationId), e.email || "", e.phone || ""]),
    };
  }
  return {
    headers: ["id", "name", "job_title", "department_id", "work_email", "work_phone"],
    rows: emps.map((e) => [e.id, e.name, e.position || e.role, stationName(data, e.stationId), e.email || "", e.phone || ""]),
  };
}

export function buildPayrollExport(data, run, system) {
  const items = run?.items || [];
  const nameOf = (id) => (data.employees || []).find((e) => e.id === id)?.name || "";
  const base = items.map((i) => [i.employeeId, nameOf(i.employeeId), i.base, i.allowances, i.bonus, i.deductions, netOf(i), i.currency]);
  if (system === "sap") {
    return { headers: ["PERNR", "ENAME", "BETRG_BASE", "BETRG_ALLW", "BETRG_BONUS", "BETRG_DEDU", "BETRG_NET", "WAERS"], rows: base };
  }
  if (system === "oracle") {
    return { headers: ["PersonNumber", "Name", "BasicSalary", "Allowances", "Bonus", "Deductions", "NetPay", "Currency"], rows: base };
  }
  return { headers: ["employee_id/name", "name", "basic_wage", "allowances", "bonus", "deductions", "net_wage", "currency"], rows: base };
}