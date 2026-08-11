import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/dateFormat";

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

/**
 * Command Center board — Platform `dash`:
 * readiness card · decisions queue · proactive alerts · payroll nudge.
 */
export default function HandoffCommandBoard({
  lang = "ar",
  readinessScore = 0,
  readinessDelta = null,
  factors = [],
  employeesCount = 0,
  employeesDelta = null,
  attendanceRate = 0,
  pendingLeave = 0,
  pendingReports = 0,
  leaveQueue = [],
  alerts = [],
  stationsCount = 0,
  openHazards = 0,
  payrollCount = 0,
  avgApprovalHours = null,
}) {
  const ar = lang === "ar";
  const pendingTotal = pendingLeave + pendingReports;
  const monthLabel = formatDate(new Date(), lang, { month: "long", year: "numeric" });
  const score = Math.max(0, Math.min(100, Math.round(Number(readinessScore) || 0)));

  const factorBars = factors.length
    ? factors.slice(0, 4)
    : [
        { label: ar ? "حضور" : "Attendance", pct: attendanceRate },
        { label: ar ? "مهام" : "Tasks", pct: Math.max(20, 100 - pendingReports * 8) },
        { label: ar ? "سلامة" : "Safety", pct: Math.max(25, 100 - openHazards * 10) },
        { label: ar ? "اعتمادات" : "Approvals", pct: Math.max(30, 100 - pendingTotal * 6) },
      ];

  const queue = leaveQueue.slice(0, 6);
  const alertLines = alerts.length
    ? alerts.slice(0, 4).map((a) => {
        if (typeof a === "string") return { text: a, to: null };
        return {
          text: a.title || a.message || a.text || String(a),
          to: a.to || a.href || null,
        };
      })
    : [
        { text: ar ? "راجع طلبات الإجازة قبل إغلاق المسير." : "Review leave requests before payroll closes.", to: "/app/leave" },
        { text: ar ? "المهام المتأخرة تؤثر على سلسلة الإثبات." : "Late tasks break the proof chain.", to: "/app/tasks" },
      ];

  return (
    <div className="nirovera-command-board flex flex-col gap-[18px]">
      <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <article className="flex flex-col gap-4 rounded-[12px] bg-[#14284B] px-5 py-5 text-white shadow-[0_1px_2px_rgba(16,24,40,.08)]">
          <p className="m-0 text-[11px] font-semibold tracking-[0.14em] text-[#8C9AB8]">
            {ar ? "مؤشر الجاهزية التشغيلية" : "OPERATIONAL READINESS"}
          </p>
          <div className="flex items-end gap-3">
            <p className="m-0 font-heading text-[56px] font-semibold leading-none tracking-tight">{score}</p>
            <p className="mb-2 m-0 text-sm text-[#B9C3D8]">/100</p>
            {readinessDelta != null && (
              <span className="mb-2 rounded-md bg-white/10 px-2 py-1 text-[11px] text-[#A7F3D0]">
                {readinessDelta > 0 ? "+" : ""}{readinessDelta}
              </span>
            )}
          </div>
          <div className="grid gap-2.5">
            {factorBars.map((f) => (
              <div key={f.label} className="grid grid-cols-[72px_1fr_36px] items-center gap-2">
                <span className="text-[11.5px] text-[#B9C3D8]">{f.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#0E7A4B]"
                    style={{ width: `${Math.max(0, Math.min(100, Number(f.pct) || 0))}%` }}
                  />
                </div>
                <span className="text-end font-heading text-[11px] text-white">{Math.round(Number(f.pct) || 0)}%</span>
              </div>
            ))}
          </div>
          <p className="m-0 text-[12px] leading-relaxed text-[#8C9AB8]">
            {ar
              ? `${stationsCount} محطة · ${employeesCount} موظف في النطاق`
              : `${stationsCount} stations · ${employeesCount} people in scope`}
            {employeesDelta != null ? (ar ? ` · +${employeesDelta} هذا الشهر` : ` · +${employeesDelta} this month`) : ""}
          </p>
        </article>

        <section className="overflow-hidden rounded-[12px] border border-[#E4E7EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          <div className="flex items-center justify-between border-b border-[#EEF0F4] px-4 py-3.5">
            <div>
              <h2 className="m-0 text-sm font-semibold text-[#101828]">
                {ar ? "ما يحتاج قرارك اليوم" : "Needs your decision today"}
              </h2>
              <p className="m-0 mt-0.5 text-[12px] text-[#667085]">
                {ar ? "مرتبة بأثرها على التشغيل، لا بتاريخها" : "Ranked by operational impact, not by date"}
              </p>
            </div>
            <span className="rounded-md bg-[#F2F4F7] px-2.5 py-1 text-[11.5px] font-medium text-[#344054]">
              {ar ? `${queue.length} بنود` : `${queue.length} items`}
            </span>
          </div>
          {queue.length === 0 ? (
            <p className="m-0 px-4 py-10 text-center text-sm text-[#98A2B3]">
              {ar ? "لا توجد قرارات معلّقة — سلسلة الإثبات نظيفة." : "No pending decisions — proof chain is clear."}
            </p>
          ) : (
            queue.map((r) => (
              <div
                key={r.id || `${r.name}-${r.date}`}
                className="grid grid-cols-[1.35fr_1.1fr_0.85fr_1fr] items-center gap-2 border-b border-[#F2F4F7] px-4 py-[11px] text-[13px] text-[#344054] last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F8] text-[11px] font-medium text-[#0B1A3F]">
                    {initials(r.name)}
                  </span>
                  <span className="truncate font-medium">{r.name}</span>
                </div>
                <span className="truncate text-[#667085]">{r.type}</span>
                <span className="font-heading text-[#667085]">{r.date}</span>
                <span className="justify-self-start rounded-md bg-[#FFF6E5] px-2.5 py-1 text-[11.5px] font-medium text-[#B54708]">
                  {r.status}
                </span>
              </div>
            ))
          )}
          <div className="border-t border-[#EEF0F4] px-4 py-3">
            <Link to="/app/leave" className="text-[12.5px] font-medium text-[#0E7A4B] hover:text-[#0B5F3A]">
              {ar ? "عرض طابور الإجازات" : "Open leave queue"}
            </Link>
          </div>
        </section>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: ar ? "نسبة الحضور اليوم" : "Attendance today",
            value: `${Number(attendanceRate).toLocaleString(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 1 })}%`,
            delta: ar ? "مقابل المجدولين" : "Of scheduled staff",
            to: "/app/attendance",
          },
          {
            label: ar ? "طلبات معلّقة" : "Pending requests",
            value: String(pendingTotal),
            delta:
              avgApprovalHours != null
                ? (ar ? `متوسط الاعتماد ${avgApprovalHours} ساعات` : `Avg approval ${avgApprovalHours}h`)
                : (ar ? `${pendingLeave} إجازة · ${pendingReports} تقرير` : `${pendingLeave} leave · ${pendingReports} reports`),
            to: "/app/leave",
          },
          {
            label: ar ? "مخاطر مفتوحة" : "Open hazards",
            value: String(openHazards),
            delta: ar ? "سلامة بانتظار الإغلاق" : "Safety awaiting closure",
            to: "/app/safety",
          },
          {
            label: ar ? `مسير ${monthLabel}` : `${monthLabel} payroll`,
            value: String(payrollCount || employeesCount),
            delta: ar ? "جاهز للمراجعة" : "Ready for review",
            to: "/app/payroll",
          },
        ].map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="flex flex-col gap-1.5 rounded-[10px] border border-[#E4E7EC] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors hover:border-[#0E7A4B]/40"
          >
            <p className="m-0 text-[12.5px] text-[#667085]">{k.label}</p>
            <p className="m-0 font-heading text-[28px] font-semibold leading-none tracking-tight text-[#101828]">{k.value}</p>
            <p className="m-0 text-xs text-[#0E7A4B]">{k.delta}</p>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
        <section className="flex flex-col gap-3 rounded-[10px] border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
          <h2 className="m-0 text-sm font-semibold text-[#101828]">{ar ? "تنبيهات استباقية" : "Proactive alerts"}</h2>
          <p className="m-0 text-[12px] text-[#667085]">
            {ar ? "كل تنبيه يفتح القسم الذي يصلحه" : "Each alert opens the section that fixes it"}
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {alertLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full bg-[#B54708]" />
                {line.to ? (
                  <Link to={line.to} className="text-[12.8px] leading-[1.7] text-[#475467] hover:text-[#0E7A4B]">
                    {line.text}
                  </Link>
                ) : (
                  <span className="text-[12.8px] leading-[1.7] text-[#475467]">{line.text}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2 rounded-[10px] bg-[#0B1A3F] p-5">
          <h2 className="m-0 text-[14px] font-semibold text-white">
            {ar ? `مسير رواتب — ${monthLabel}` : `Payroll — ${monthLabel}`}
          </h2>
          <p className="m-0 text-[12.5px] leading-relaxed text-[#B9C3D8]">
            {ar
              ? `الإغلاق قريب · ${payrollCount || employeesCount} موظف · راجع المسير قبل الاعتماد`
              : `Closing soon · ${payrollCount || employeesCount} employees · review before approve`}
          </p>
          <Link
            to="/app/payroll"
            className="mt-1 self-start rounded-lg bg-[#0E7A4B] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#0B5F3A]"
          >
            {ar ? "مراجعة المسير" : "Review payroll"}
          </Link>
        </section>
      </div>
    </div>
  );
}
