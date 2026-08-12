import React, { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { ATT_STATUS, SETTLEMENT_KINDS } from "@/lib/attendanceDerivations";
import { toast } from "@/components/ui/use-toast";

const STATUS_LABEL = {
  all: { ar: "الكل", en: "All" },
  present: { ar: "حاضر", en: "Present" },
  late: { ar: "متأخر", en: "Late" },
  leave: { ar: "إجازة", en: "Leave" },
  absent: { ar: "غائب", en: "Absent" },
  rest: { ar: "راحة", en: "Rest" },
};

const GEO_LABEL = {
  inside: { ar: "داخل النطاق", en: "Inside geofence" },
  outside: { ar: "خارج النطاق", en: "Outside geofence" },
  pending_review: { ar: "بانتظار قرار", en: "Needs review" },
  accepted_outside: { ar: "قُبل خارج النطاق", en: "Accepted outside" },
  rejected_outside: { ar: "رُفض · غياب", en: "Rejected · absence" },
  self_declaration: { ar: "إقرار ذاتي", en: "Self-declaration" },
};

/**
 * Attendance handoff board — stats, chips, gates from `attendance` function.
 * Status filters bind to stable ATT_STATUS ids, never translated strings.
 */
export default function AttendanceHandoffBoard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company } = useAuth();
  const [status, setStatus] = useState("all");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [geoReason, setGeoReason] = useState({});
  const [settle, setSettle] = useState(null);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("attendance", {
        action: "listDay",
        companyId: company.id,
        status,
      });
      setPayload(res?.data || res || null);
    } catch (e) {
      toast({
        title: ar ? "تعذّر تحميل الحضور" : "Could not load attendance",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, status, ar]);

  useEffect(() => {
    load();
  }, [load]);

  const invoke = async (body) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("attendance", { companyId: company.id, ...body });
      const data = res?.data || res;
      if (data?.error) {
        toast({
          title: ar ? "مرفوض" : "Blocked",
          description: ar ? (data.reason || data.error) : (data.reasonEn || data.reason || data.error),
          variant: "destructive",
        });
        return;
      }
      await load();
    } catch (e) {
      toast({
        title: ar ? "فشل الإجراء" : "Action failed",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const chips = ["all", ...Object.values(ATT_STATUS)];
  const stats = payload?.stats;

  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="m-0 font-heading text-[15px] font-semibold text-[#14284B]">
              {ar ? "حضور اليوم" : "Today's attendance"}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#5A6B85]">
              {ar ? payload?.wordingAr : payload?.wordingEn}
              {" · "}
              {ar
                ? `سماح ${payload?.graceMinutes ?? 10} د · وردية ${payload?.shiftHours ?? 8} س`
                : `${payload?.graceMinutes ?? 10}-min grace · ${payload?.shiftHours ?? 8}h shift`}
            </p>
          </div>
          <button
            type="button"
            disabled={busy || loading}
            onClick={load}
            className="rounded-md border border-[#E2E8F0] px-3 py-1.5 text-[12px] text-[#14284B]"
          >
            {ar ? "تحديث" : "Refresh"}
          </button>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: ar ? "نسبة الحضور" : "Attendance rate",
                value: `${stats.rate}%`,
                suffix: ar ? "من المجدولين" : "of scheduled",
              },
              {
                label: ar ? "متوسط التأخير" : "Avg lateness",
                value: String(stats.avgLateMinutes),
                suffix: ar
                  ? `دقيقة · بعد سماح ${stats.graceMinutes}`
                  : `min · after ${stats.graceMinutes}-min grace`,
              },
              {
                label: ar ? "خارج النطاق" : "Outside geofence",
                value: String(stats.outsideNeedingReview),
                suffix: ar ? "تحتاج مراجعة" : "need review",
                hot: stats.outsideNeedingReview > 0,
              },
              {
                label: ar ? "ساعات العمل" : "Work hours",
                value: String(stats.workHours),
                suffix: ar ? "ساعة" : "h",
              },
              {
                label: ar ? "غياب غير مبرر" : "Unexcused absence",
                value: String(stats.absentUnexcused),
                suffix: ar ? "موظف" : "people",
                hot: stats.absentUnexcused > 0,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-[13px] border border-[#E2E8F0] px-4 py-3.5">
                <div className="text-[11px] text-[#5A6B85]">{s.label}</div>
                <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                  <span
                    className="font-heading text-[26px] font-semibold leading-none"
                    style={{ color: s.hot ? "#DC2626" : "#14284B" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-[11px] text-[#5A6B85]">{s.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={`rounded-full border px-3 py-1 text-[12px] ${
              status === id
                ? "border-[#14284B] bg-[#14284B] text-white"
                : "border-[#E2E8F0] bg-white text-[#14284B]"
            }`}
          >
            {STATUS_LABEL[id]?.[ar ? "ar" : "en"] || id}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[#E2E8F0] bg-white">
        {loading ? (
          <p className="p-5 text-sm text-[#5A6B85]">…</p>
        ) : payload?.empty ? (
          <p className="p-5 text-sm text-[#5A6B85]">
            {ar ? payload.emptyReasonAr : payload.emptyReasonEn}
          </p>
        ) : (
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F7F8FA] text-[10px] font-semibold uppercase tracking-wide text-[#5A6B85]">
                <th className="px-3 py-2.5 text-start">{ar ? "الموظف" : "Employee"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "الحالة" : "Status"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "حضور" : "In"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "انصراف" : "Out"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "ساعات" : "Hours"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "الموقع" : "Geo"}</th>
                <th className="px-3 py-2.5 text-center">{ar ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {(payload?.rows || []).map((row) => (
                <tr key={`${row.employeeId}-${row.date}`} className="border-b border-[#F1F5F9]">
                  <td className="px-3 py-3 font-medium text-[#14284B]">{row.employeeName || row.employeeId}</td>
                  <td className="px-3 py-3 text-center">
                    {STATUS_LABEL[row.status]?.[ar ? "ar" : "en"] || row.status}
                  </td>
                  <td className="px-3 py-3 text-center">{row.checkIn || "—"}</td>
                  <td className="px-3 py-3 text-center">{row.checkOut || "—"}</td>
                  <td className="px-3 py-3 text-center">{row.workedLabel}</td>
                  <td className="px-3 py-3 text-center text-[12px]">
                    {GEO_LABEL[row.geo]?.[ar ? "ar" : "en"] || row.geo}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-stretch gap-1">
                      {row.geo === "pending_review" && (
                        <>
                          <input
                            className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px]"
                            placeholder={ar ? "مبرر القبول" : "Accept reason"}
                            value={geoReason[row.employeeId] || ""}
                            onChange={(e) =>
                              setGeoReason((m) => ({ ...m, [row.employeeId]: e.target.value }))
                            }
                          />
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              disabled={busy}
                              className="rounded bg-[#14284B] px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                invoke({
                                  action: "resolveGeofence",
                                  employeeId: row.employeeId,
                                  employeeName: row.employeeName,
                                  date: row.date || payload.date,
                                  checkIn: row.checkIn,
                                  geoVerdict: "outside",
                                  decision: "accept",
                                  reason: geoReason[row.employeeId],
                                })
                              }
                            >
                              {ar ? "قبول بمبرر" : "Accept"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              className="rounded border border-[#DC2626] px-2 py-1 text-[11px] text-[#DC2626]"
                              onClick={() =>
                                invoke({
                                  action: "resolveGeofence",
                                  employeeId: row.employeeId,
                                  date: row.date || payload.date,
                                  geoVerdict: "outside",
                                  decision: "reject",
                                })
                              }
                            >
                              {ar ? "رفض" : "Reject"}
                            </button>
                          </div>
                        </>
                      )}
                      {row.status === "absent" && !row.settlement && (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px]"
                          onClick={() =>
                            setSettle({
                              employeeId: row.employeeId,
                              employeeName: row.employeeName,
                              date: row.date || payload.date,
                              kind: "sick",
                              documentName: "",
                            })
                          }
                        >
                          {ar ? "تسوية بمستند" : "Settle with doc"}
                        </button>
                      )}
                      {row.overtimeMinutes > 0 && row.overtimeApproved == null && (
                        <div className="flex gap-1 justify-center">
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px]"
                            onClick={() =>
                              invoke({
                                action: "decideOvertime",
                                employeeId: row.employeeId,
                                date: row.date || payload.date,
                                decision: "approve",
                              })
                            }
                          >
                            {ar ? "اعتماد إضافي" : "Approve OT"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px]"
                            onClick={() =>
                              invoke({
                                action: "decideOvertime",
                                employeeId: row.employeeId,
                                date: row.date || payload.date,
                                decision: "reject",
                              })
                            }
                          >
                            {ar ? "رفض إضافي" : "Reject OT"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {settle && (
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 space-y-3">
          <h4 className="m-0 text-[14px] font-semibold text-[#14284B]">
            {ar ? "تسوية غياب — القيد الأصلي لا يُمحى" : "Settle absence — original entry is kept"}
          </h4>
          <p className="m-0 text-[12px] text-[#5A6B85]">
            {settle.employeeName} · {settle.date}
          </p>
          <select
            className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-sm"
            value={settle.kind}
            onChange={(e) => setSettle((s) => ({ ...s, kind: e.target.value }))}
          >
            {SETTLEMENT_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-sm"
            placeholder={ar ? "اسم المستند" : "Document name"}
            value={settle.documentName}
            onChange={(e) => setSettle((s) => ({ ...s, documentName: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded bg-[#14284B] px-3 py-2 text-sm text-white"
              onClick={async () => {
                await invoke({
                  action: "settleAbsence",
                  ...settle,
                });
                setSettle(null);
              }}
            >
              {ar ? "حفظ التسوية" : "Save settlement"}
            </button>
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setSettle(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
