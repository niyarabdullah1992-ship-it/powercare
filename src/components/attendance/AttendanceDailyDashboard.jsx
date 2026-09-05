import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, PenLine } from "lucide-react";
import LocationMapModal from "@/components/attendance/LocationMapModal";
import { useI18n } from "@/lib/i18n";
import { formatTime, useTimeFormat } from "@/hooks/useTimeFormat";
import { deriveTeamAttendanceToday, getAttendanceStatus } from "@/lib/attendance";
import { listLocalTodayAttendance, localAttendanceSettings, mergeAttendanceRows } from "@/lib/localAttendanceFallback";
import EmployeeIdentityRow from "@/components/employees/EmployeeIdentityRow";
import AttendanceKpiStrip from "@/components/attendance/AttendanceKpiStrip";
import { ACCENT, BAD, BORDER, CARD, DANGER, MUTED, NAVY, NEUTRAL, OK, WARN, emptyState, field, tableShell, tag, SURFACE } from "@/lib/platformStyles";

const DAILY_COLS = "minmax(132px,1.2fr) 108px 68px 68px 52px minmax(118px,1fr) minmax(148px,1.15fr)";

const compactPill = (bg, fg, bd) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "1px 7px",
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 600,
  background: bg,
  color: fg,
  border: `1px solid ${bd}`,
  whiteSpace: "nowrap",
  lineHeight: 1.4,
});

const STATUS_PILL = {
  present: compactPill("#ECFDF3", "#15803D", "#BBF7D0"),
  late: compactPill("#FFFBEB", "#B45309", "#FDE68A"),
  absent: compactPill("#FEF2F2", "#DC2626", "#FECACA"),
  on_leave: compactPill("#EFF6FF", "#1D4ED8", "#BFDBFE"),
  not_scheduled: compactPill("#F7F8FA", "#5A6B85", "#E2E8F0"),
  off_day: compactPill("#F7F8FA", "#5A6B85", "#E2E8F0"),
  not_yet: compactPill("#F7F8FA", "#5A6B85", "#E2E8F0"),
};

const miniBtn = (variant = "ghost") => ({
  height: 24,
  padding: "0 8px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  lineHeight: 1,
  border: variant === "primary" ? `1px solid ${ACCENT}` : "1px solid #E2E8F0",
  background: variant === "primary" ? ACCENT : CARD,
  color: variant === "primary" ? "#fff" : NAVY,
});

const headCell = {
  display: "grid",
  gridTemplateColumns: DAILY_COLS,
  gap: 8,
  padding: "9px 14px",
  background: SURFACE,
  borderBottom: "1px solid #E2E8F0",
  fontSize: 10,
  letterSpacing: "0.06em",
  color: MUTED,
  fontWeight: 600,
};

const rowCell = {
  display: "grid",
  gridTemplateColumns: DAILY_COLS,
  gap: 8,
  padding: "9px 14px",
  borderBottom: "1px solid #F1F5F9",
  alignItems: "center",
  fontSize: 12,
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [policy, setPolicy] = useState(() => ({
    gps_enabled: company?.attendanceSettings?.gps_enabled === true,
    late_threshold_minutes: company?.attendanceSettings?.late_threshold_minutes ?? localAttendanceSettings().late_grace_minutes ?? 15,
  }));

  const load = () => {
    const apply = (cloudRows, settings) => {
      setRows(mergeAttendanceRows(cloudRows || [], listLocalTodayAttendance(company?.id, data)));
      if (settings) {
        setPolicy({
          gps_enabled: settings.gps_enabled === true,
          late_threshold_minutes: settings.late_threshold_minutes ?? settings.late_grace_minutes ?? 15,
        });
      }
    };
    if (!employees.length) { apply([]); setLoading(false); return; }
    setLoading(true);
    return Promise.all([
      base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) }),
      company?.id
        ? base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([res, setRes]) => apply(res?.data?.rows || [], setRes?.data?.settings || company?.attendanceSettings))
      .catch(() => apply([], company?.attendanceSettings))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const onUpdated = () => load();
    window.addEventListener("attendance-updated", onUpdated);
    return () => window.removeEventListener("attendance-updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.map((e) => e.id).join(","), company?.id]);

  const isManager = currentUser?.id === data?.ownerId || ["station_manager", "ops_manager", "director"].includes(currentUser?.role);

  const manualCheckIn = async (employee) => {
    setManualLoadingId(employee.id);
    try {
      const res = await base44.functions.invoke("supabaseAttendance", { action: "manualCheckIn", companyId: company.id, employeeId: employee.id, managerName: currentUser.name });
      const attendance = res?.data?.attendance;
      if (attendance) {
        setRows((prev) => [...prev.filter((row) => String(row.employee_id ?? row.employeeId) !== String(employee.id)), attendance]);
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
        setRows((prev) => prev.map((row) => (String(row.employee_id ?? row.employeeId) === String(employee.id) ? attendance : row)));
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

  const byEmployee = Object.fromEntries(rows.map((r) => [String(r.employee_id ?? r.employeeId), r]));
  const statusFor = (employee) => getAttendanceStatus(employee, byEmployee[String(employee.id)], data);
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
  const dailyWorkHours = rows.reduce((sum, row) => sum + (Number(row.work_hours) || 0), 0);
  const anyCheckout = rows.some((row) => row?.check_out_at);
  const presentLike = counts.present + counts.late;
  const visibleEmployees = employees.filter((employee) => {
    const status = statusFor(employee);
    if (statusFilter === "present") return status === "present" || status === "late";
    if (statusFilter === "absent") return status === "absent";
    return true;
  });
  const filters = [
    { key: "all", ar: "الكل", en: "All" },
    { key: "present", ar: "حاضر", en: "Present" },
    { key: "absent", ar: "غائب", en: "Absent" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} dir={lang === "ar" ? "rtl" : "ltr"}>
      {!loading && employees.length > 0 && (() => {
        const todayAtt = deriveTeamAttendanceToday(employees, rows, data);
        const rate = todayAtt.rate;
        const outside = rows.filter((r) => r.location_status === "outside").length;
        const lateAvg = (() => {
          const lateRows = rows.filter((r) => Number(r.late_minutes) > 0);
          if (!lateRows.length) return 0;
          return Math.round(lateRows.reduce((s, r) => s + Number(r.late_minutes || 0), 0) / lateRows.length);
        })();
        const grace = policy.late_threshold_minutes ?? 15;
        return (
          <AttendanceKpiStrip
            items={[
              {
                label: lang === "ar" ? "نسبة الحضور اليوم" : "Attendance rate today",
                value: `${rate}%`,
                suffix: lang === "ar" ? `من ${todayAtt.scheduled} متوقعًا` : `of ${todayAtt.scheduled} expected`,
                accent: rate >= 80,
                hot: rate < 80,
              },
              {
                label: t("totalAbsent"),
                value: String(counts.absent),
                suffix: lang === "ar" ? "بلا تسجيل حتى الآن" : "No punch yet",
                hot: counts.absent > 0,
              },
              {
                label: lang === "ar" ? "متوسط التأخير" : "Avg lateness",
                value: String(lateAvg),
                suffix: lang === "ar" ? `د · السماح ${grace} د` : `m · ${grace}m grace`,
                hot: lateAvg > 0,
              },
              {
                label: lang === "ar" ? "خارج النطاق" : "Outside geofence",
                value: String(outside),
                suffix: policy.gps_enabled
                  ? (lang === "ar" ? "شرط الموقع: تشغيل" : "Location: on")
                  : (lang === "ar" ? "شرط الموقع: إيقاف" : "Location: off"),
                hot: outside > 0,
              },
              {
                label: lang === "ar" ? "ساعات العمل" : "Work hours",
                value: dailyWorkHours.toFixed(1),
                suffix: anyCheckout
                  ? (lang === "ar" ? "س" : "h")
                  : (lang === "ar" ? "لا انصراف مسجل" : "No checkout yet"),
              },
            ]}
          />
        );
      })()}

    <div style={tableShell}>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{t("dailyAttendance")}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
            {lang === "ar"
              ? `حضور الفريق اليوم: ${presentLike} حاضر ، ${counts.absent} غائب`
              : `Team attendance today: ${presentLike} present, ${counts.absent} absent`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {filters.map((item) => {
            const on = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                style={{
                  height: 28,
                  padding: "0 11px",
                  borderRadius: 20,
                  border: `1px solid ${on ? "#BBF7D0" : BORDER}`,
                  background: on ? "#ECFDF3" : CARD,
                  color: on ? NAVY : MUTED,
                  fontSize: 11,
                  fontWeight: on ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {lang === "ar" ? item.ar : item.en}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: MUTED }}>…</div>
      ) : employees.length === 0 ? (
        <div style={{ ...emptyState, marginTop: 12 }}>{t("noAttendanceRecords")}</div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <div style={{ minWidth: 860 }}>
            <div style={headCell}>
              <div>{lang === "ar" ? "الاسم" : "Name"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "الحالة" : "Status"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "حضور" : "In"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "انصراف" : "Out"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "ساعات" : "Hours"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "الموقع" : "Location"}</div>
              <div style={{ textAlign: "center" }}>{lang === "ar" ? "إجراء" : "Action"}</div>
            </div>
            {visibleEmployees.map((e) => {
              const r = byEmployee[String(e.id)];
              const status = statusFor(e);
              return (
                <div
                  key={e.id}
                  style={rowCell}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = SURFACE; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <EmployeeIdentityRow employee={e} employeeId={e.id} name={e.name} showId={false} compact />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={STATUS_PILL[status] || NEUTRAL}>{statusLabel(status)}</span>
                      {status === "late" && Number(r?.late_minutes) > 0 && (
                        <span style={{ fontSize: 10, color: "#B45309" }}>{t("lateBy")} {r.late_minutes} {t("minutesUnit")}</span>
                      )}
                      {r?.excused && <span style={{ fontSize: 10, color: "#15803D" }}>{t("excused")}</span>}
                      {isPastCheckoutMissing(r) && <span style={BAD}>{t("missingCheckoutLabel")}</span>}
                      {r?.early_checkout && <span style={WARN}>{t("earlyCheckoutLabel")}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                    {r?.check_in_at ? formatTime(r.check_in_at, format, lang) : "—"}
                  </div>
                  <div style={{ textAlign: "center", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                    {r?.check_out_at ? formatTime(r.check_out_at, format, lang) : "—"}
                  </div>
                  <div style={{ textAlign: "center", color: MUTED }}>{r?.work_hours ?? "—"}</div>
                  <div style={{ textAlign: "center" }}>
                    {r?.location_status === "manual" ? (
                      <span style={NEUTRAL}>
                        <MapPin style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginInlineEnd: 3 }} />
                        {lang === "ar" ? "غير متحقق" : "Not verified"}
                      </span>
                    ) : r?.location_status ? (
                      <button
                        type="button"
                        onClick={() => setMapRow(r)}
                        title={t("viewOnMap")}
                        style={{
                          ...(r.location_status === "inside" ? OK : BAD),
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <MapPin style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle", marginInlineEnd: 3 }} />
                        {r.location_status === "inside" ? t("insideLocation") : t("outsideLocation")}
                        {r.distance_meters != null && ` · ${r.distance_meters}m`}
                      </button>
                    ) : <span style={{ color: MUTED }}>—</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    {isManager && isPastCheckoutMissing(r) && (
                      checkoutEmployeeId === e.id ? (
                        <div style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #E2E8F0", background: SURFACE }}>
                          <input
                            value={checkoutReason}
                            onChange={(ev) => { setCheckoutReason(ev.target.value); setCheckoutError(""); }}
                            placeholder={lang === "ar" ? "سبب الإغلاق" : "Reason for closing"}
                            style={{ ...field, height: 30, fontSize: 11, marginBottom: 6 }}
                            autoFocus
                          />
                          {checkoutError && <p style={{ fontSize: 10, color: DANGER, margin: "0 0 6px" }}>{checkoutError}</p>}
                          <div style={{ display: "flex", gap: 4 }}>
                            <button type="button" onClick={() => manualCheckOut(e)} disabled={manualLoadingId === e.id} style={miniBtn("primary")}>
                              {manualLoadingId === e.id && <Loader2 style={{ width: 10, height: 10, display: "inline", animation: "spin 1s linear infinite" }} />}
                              {lang === "ar" ? "حفظ" : "Save"}
                            </button>
                            <button type="button" onClick={() => { setCheckoutEmployeeId(null); setCheckoutReason(""); setCheckoutError(""); }} style={miniBtn()}>
                              {lang === "ar" ? "إلغاء" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setCheckoutEmployeeId(e.id); setCheckoutReason(""); setCheckoutError(""); }} style={miniBtn()}>
                          <PenLine style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle", marginInlineEnd: 3 }} />
                          {lang === "ar" ? "إغلاق يدوي" : "Manual out"}
                        </button>
                      )
                    )}
                    {(r?.manual_override || r?.location_status === "manual") ? (
                      <span title={`${lang === "ar" ? "حضور يدوي بواسطة" : "Manual by"} ${r.override_by || r.excused_by_name || "—"}`} style={tag("#F5F3FF", "#6D28D9", "#DDD6FE")}>
                        <PenLine style={{ width: 10, height: 10 }} />
                        {lang === "ar" ? "يدوي" : "Manual"} · {r.override_by || r.excused_by_name || "—"}
                      </span>
                    ) : isManager && !r?.check_in_at ? (
                      <button type="button" onClick={() => manualCheckIn(e)} disabled={manualLoadingId === e.id} style={{ ...miniBtn("primary"), opacity: manualLoadingId === e.id ? 0.6 : 1 }}>
                        {manualLoadingId === e.id ? <Loader2 style={{ width: 11, height: 11, display: "inline" }} /> : null}
                        {lang === "ar" ? "حضر" : "Present"}
                      </button>
                    ) : null}
                    {(status === "late" || status === "absent") && r?.id && (
                      <button
                        type="button"
                        onClick={() => toggleExcuse(r)}
                        style={r?.excused ? miniBtn() : { ...miniBtn(), border: "1px solid #BBF7D0", color: "#15803D" }}
                      >
                        {status === "absent"
                          ? (r?.excused ? (lang === "ar" ? "إلغاء إعفاء" : "Remove excuse") : (lang === "ar" ? "إعفاء الغياب" : "Excuse absence"))
                          : (r?.excused ? t("unexcuseLate") : t("excuseLate"))}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mapRow && <LocationMapModal row={mapRow} t={t} onClose={() => setMapRow(null)} />}
      </div>
    </div>
    </div>
  );
}