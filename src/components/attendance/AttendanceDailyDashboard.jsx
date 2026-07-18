import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, PenLine } from "lucide-react";
import LocationMapModal from "@/components/attendance/LocationMapModal";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";
import { getAttendanceStatus } from "@/lib/attendance";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

const STATUS_STYLE = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  on_leave: "bg-sky-100 text-sky-700 border-sky-300",
  not_scheduled: "bg-muted text-muted-foreground border-border",
  off_day: "bg-muted text-muted-foreground border-border",
  not_yet: "bg-muted text-muted-foreground border-border",
};

// Manager-facing daily attendance table — merges the visible employee roster (local
// data) with today's attendance rows (Supabase) so unrecorded employees still show up.
export default function AttendanceDailyDashboard({ employees, currentUser, company, data, t }) {
  const { lang } = useI18n();
  const { format } = useTimeFormat();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapRow, setMapRow] = useState(null);
  const [manualLoadingId, setManualLoadingId] = useState(null);
  const [checkoutEmployeeId, setCheckoutEmployeeId] = useState(null);
  const [checkoutReason, setCheckoutReason] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const load = () => {
    if (!employees.length) { setRows([]); setLoading(false); return; }
    setLoading(true);
    return base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.map((e) => e.id).join(",")]);

  const isManager = currentUser?.id === data?.ownerId || ["station_manager", "ops_manager", "director"].includes(currentUser?.role);

  const manualCheckIn = async (employee) => {
    setManualLoadingId(employee.id);
    try {
      const res = await base44.functions.invoke("supabaseAttendance", { action: "manualCheckIn", companyId: company.id, employeeId: employee.id, managerName: currentUser.name });
      const attendance = res?.data?.attendance;
      if (attendance) {
        setRows((prev) => [...prev.filter((row) => row.employee_id !== employee.id), attendance]);
        window.dispatchEvent(new CustomEvent("attendance-updated", { detail: attendance }));
      }
    } finally {
      setManualLoadingId(null);
    }
  };

  const manualCheckOut = async (employee) => {
    const reason = checkoutReason.trim();
    if (!reason) {
      setCheckoutError(lang === "ar" ? "سبب الإغلاق مطلوب." : "A reason is required.");
      return;
    }
    setCheckoutError("");
    setManualLoadingId(employee.id);
    try {
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "manualCheckOut", companyId: company.id, employeeId: employee.id, reason,
      });
      const attendance = res?.data?.attendance;
      if (attendance) {
        setRows((prev) => prev.map((row) => (row.employee_id === employee.id ? attendance : row)));
        setCheckoutEmployeeId(null);
        setCheckoutReason("");
        window.dispatchEvent(new CustomEvent("attendance-updated", { detail: attendance }));
      }
    } catch (error) {
      setCheckoutError(error?.response?.data?.error || (lang === "ar" ? "تعذر إغلاق الحضور." : "Could not close attendance."));
    } finally {
      setManualLoadingId(null);
    }
  };

  const toggleExcuse = async (r) => {
    try {
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "excuseAttendance",
        userRole: currentUser?.role,
        attendanceId: r.id,
        managerId: currentUser?.id,
        managerName: currentUser?.name,
        excused: !r.excused,
      });
      const updated = res?.data?.attendance;
      if (updated) setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      // best-effort
    }
  };

  const byEmployee = Object.fromEntries(rows.map((r) => [r.employee_id, r]));
  const statusFor = (employee) => getAttendanceStatus(employee, byEmployee[employee.id], data);
  const counts = employees.reduce((total, employee) => {
    const status = statusFor(employee);
    if (status === "on_leave") total.onLeave++;
    else if (status === "not_scheduled") total.notScheduled++;
    else if (status === "absent") total.absent++;
    else if (status === "late") total.late++;
    else total.present++;
    return total;
  }, { present: 0, late: 0, absent: 0, onLeave: 0, notScheduled: 0 });
  const statusLabel = (status) => {
    if (status === "on_leave") return t("onLeaveStatus");
    if (status === "not_scheduled") return lang === "ar" ? "غير مجدول" : "Not scheduled";
    return t(`attendanceStatus${status.charAt(0).toUpperCase()}${status.slice(1).replace(/_([a-z])/, (match, char) => char.toUpperCase())}`);
  };
  const isPastCheckoutMissing = (r) => r?.check_in_at && !r?.check_out_at && r?.status !== "absent";

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-heading text-lg font-semibold">{t("dailyAttendance")}</h3>
        <div className="flex flex-wrap items-center gap-2">
        <ComparisonExportButtons
          title={t("dailyAttendance")}
          headers={[t("employeeName"), t("status"), t("checkIn"), t("checkOut"), t("workHoursLabel"), t("locationStatus"), lang === "ar" ? "التحضير" : "Attendance source"]}
          rows={employees.map((e) => {
            const r = byEmployee[e.id];
            return [e.name, statusLabel(statusFor(e)), r?.check_in_at ? formatTime(r.check_in_at, format, lang) : "—", r?.check_out_at ? formatTime(r.check_out_at, format, lang) : "—", r?.work_hours ?? "—", r?.location_status || "—", (r?.manual_override || r?.location_status === "manual") ? `${lang === "ar" ? "يدوي" : "Manual"} — ${r.override_by || r.excused_by_name || "—"}` : "—"];
          })}
        />
        </div>
      </div>
      {!loading && employees.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-center"><strong className="block text-lg text-emerald-700">{counts.present}</strong><span className="text-xs text-emerald-700">{t("totalPresent")}</span></div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center"><strong className="block text-lg text-amber-700">{counts.late}</strong><span className="text-xs text-amber-700">{t("totalLate")}</span></div>
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-center"><strong className="block text-lg text-red-700">{counts.absent}</strong><span className="text-xs text-red-700">{t("totalAbsent")}</span></div>
          <div className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-center"><strong className="block text-lg text-sky-700">{counts.onLeave}</strong><span className="text-xs text-sky-700">{t("onLeaveStatus")}</span></div>
          <div className="rounded-lg border border-border bg-muted p-3 text-center"><strong className="block text-lg">{counts.notScheduled}</strong><span className="text-xs text-muted-foreground">{lang === "ar" ? "غير مجدول" : "Not scheduled"}</span></div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm font-body">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="px-2 py-3 text-start">{t("employeeName")}</th>
                <th className="px-2 py-3 text-center">{t("status")}</th>
                <th className="px-2 py-3 text-center">{t("checkIn")}</th>
                <th className="px-2 py-3 text-center">{t("checkOut")}</th>
                <th className="px-2 py-3 text-center">{t("workHoursLabel")}</th>
                <th className="px-2 py-3 text-center">{t("locationStatus")}</th>
                <th className="px-2 py-3 text-center">{lang === "ar" ? "الإجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const r = byEmployee[e.id];
                const status = statusFor(e);
                return (
                  <tr key={e.id} className="border-b border-border/60 align-middle">
                    <td className="px-2 py-3 text-start"><EmployeeNameLink employeeId={e.id} employeeName={e.name} className="block font-medium leading-tight" /></td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[status]}`}>
                          {statusLabel(status)}
                        </span>
                        {status === "late" && Number(r?.late_minutes) > 0 && (
                          <span className="text-[11px] text-amber-700">{t("lateBy")} {r.late_minutes} {t("minutesUnit")}</span>
                        )}
                        {r?.excused && <span className="text-[11px] text-emerald-700">{t("excused")}</span>}
                        {isPastCheckoutMissing(r) && (
                          <span className="whitespace-nowrap rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">{t("missingCheckoutLabel")}</span>
                        )}
                        {r?.early_checkout && (
                          <span className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{t("earlyCheckoutLabel")}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{r?.check_in_at ? formatTime(r.check_in_at, format, lang) : "—"}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{r?.check_out_at ? formatTime(r.check_out_at, format, lang) : "—"}</td>
                    <td className="px-2 py-3 text-center text-muted-foreground">{r?.work_hours ?? "—"}</td>
                    <td className="px-2 py-3 text-center">
                      {r?.location_status === "manual" ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{lang === "ar" ? "الموقع غير متحقق" : "Location not verified"}
                        </span>
                      ) : r?.location_status ? (
                        <button
                          onClick={() => setMapRow(r)}
                          className={`mx-auto flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs hover:opacity-80 ${r.location_status === "inside" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-red-300 bg-red-100 text-red-700"}`}
                          title={t("viewOnMap")}
                        >
                          <MapPin className="h-3 w-3" />
                          {r.location_status === "inside" ? t("insideLocation") : t("outsideLocation")}
                          {r.distance_meters != null && ` · ${r.distance_meters}m`}
                        </button>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                      {isManager && isPastCheckoutMissing(r) && (
                        checkoutEmployeeId === e.id ? (
                          <div className="w-full space-y-1.5 rounded-md border border-violet-200 bg-violet-50 p-2 text-start">
                            <input
                              value={checkoutReason}
                              onChange={(event) => { setCheckoutReason(event.target.value); setCheckoutError(""); }}
                              placeholder={lang === "ar" ? "سبب الإغلاق" : "Reason for closing"}
                              className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-xs"
                              autoFocus
                            />
                            {checkoutError && <p className="text-[11px] text-destructive">{checkoutError}</p>}
                            <div className="flex gap-1">
                              <button onClick={() => manualCheckOut(e)} disabled={manualLoadingId === e.id} className="inline-flex items-center gap-1 rounded-md bg-violet-700 px-2 py-1 text-xs text-white disabled:opacity-50">
                                {manualLoadingId === e.id && <Loader2 className="h-3 w-3 animate-spin" />}{lang === "ar" ? "حفظ" : "Save"}
                              </button>
                              <button onClick={() => { setCheckoutEmployeeId(null); setCheckoutReason(""); setCheckoutError(""); }} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setCheckoutEmployeeId(e.id); setCheckoutReason(""); setCheckoutError(""); }} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-violet-300 px-2 py-1 text-xs text-violet-700 hover:bg-violet-50">
                            <PenLine className="h-3.5 w-3.5" />{lang === "ar" ? "إغلاق يدوي" : "Manual check-out"}
                          </button>
                        )
                      )}
                      {(r?.manual_override || r?.location_status === "manual") ? (
                        <span title={`${lang === "ar" ? "حضور يدوي بواسطة" : "Manual by"} ${r.override_by || r.excused_by_name || "—"}`} className="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs text-violet-700">
                          <PenLine className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{lang === "ar" ? "يدوي" : "Manual"} · {r.override_by || r.excused_by_name || "—"}</span>
                        </span>
                      ) : isManager && !r?.check_in_at ? (
                        <button onClick={() => manualCheckIn(e)} disabled={manualLoadingId === e.id} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-violet-300 px-2 py-1 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-50">
                          {manualLoadingId === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}{lang === "ar" ? "تحضير يدوي" : "Manual check-in"}
                        </button>
                      ) : null}
                      {(status === "late" || status === "absent") && r?.id && (
                        <button
                          onClick={() => toggleExcuse(r)}
                          className={`whitespace-nowrap rounded-md border px-2 py-1 text-xs font-body transition ${r?.excused ? "border-border text-muted-foreground hover:bg-muted" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {status === "absent"
                            ? (r?.excused ? (lang === "ar" ? "إلغاء إعفاء الغياب" : "Remove absence excuse") : (lang === "ar" ? "إعفاء الغياب" : "Excuse absence"))
                            : (r?.excused ? t("unexcuseLate") : t("excuseLate"))}
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {mapRow && <LocationMapModal row={mapRow} t={t} onClose={() => setMapRow(null)} />}
    </div>
  );
}