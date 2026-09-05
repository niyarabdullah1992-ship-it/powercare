import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { toast } from "@/components/ui/use-toast";
import { BAD, MUTED, NAVY, NEUTRAL, OK, WARN, BRAND, BRAND_BORDER, BRAND_DEEP, BRAND_SOFT, ACCENT, num, pageCol, pill, statCard, ui, CARD } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";
import {
  approveLocalDaily,
  buildLocalDailyBoard,
  chaseLocalDaily,
  fileLocalDaily,
  issueSignedLocalDaily,
  returnLocalDaily,
  shouldUseLocalDaily,
} from "@/lib/localDailyFallback";
import { isLocalPreviewActive } from "@/lib/localPreview";
import { getCompanyData } from "@/lib/store";
import {
  buildShortDailyNote,
  canApproveDailyRole,
  canFileDailyRole,
  checkApproveDailyRoleGate,
  checkCloseShiftDailyGate,
  checkFileDailyGate,
  checkIssueSignedDailyGate,
} from "@/lib/dailyReportDerivations";

async function dailyReport(payload) {
  const res = await base44.functions.invoke("dailyReport", payload);
  return res?.data ?? res;
}

const FACT_META = {
  tasks: {
    ar: ["مهمة مُغلقة", "مهام مُغلقة"],
    en: ["task closed", "tasks closed"],
    to: "/app/tasks",
  },
  hazards: {
    ar: ["خطر مفتوح", "مخاطر مفتوحة"],
    en: ["open hazard", "open hazards"],
    to: "/app/safety",
  },
  absence: {
    ar: ["غياب غير مبرر", "حالات غياب"],
    en: ["unexcused absence", "unexcused absences"],
    to: "/app/attendance",
  },
  proofs: {
    ar: ["إثبات معتمد", "إثباتات معتمدة"],
    en: ["proof approved", "proofs approved"],
    to: "/app/work-proof",
  },
};

const STATUS = {
  approved: { ar: "معتمد", en: "Approved", style: OK },
  ok: { ar: "مرفوع", en: "Submitted", style: OK },
  late: { ar: "متأخر", en: "Late", style: BAD },
  review: { ar: "يحتاج مراجعة", en: "Needs review", style: WARN },
  missing: { ar: "لم يُرفع", en: "Not submitted", style: NEUTRAL },
};

const btnGhost = {
  padding: "7px 13px",
  borderRadius: "9px",
  border: "1px solid #E2E8F0",
  background: CARD,
  color: MUTED,
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const btnApproveAll = {
  padding: "7px 13px",
  borderRadius: "9px",
  border: "1px solid #1E9E63",
  background: CARD,
  color: "#14683F",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const btnAct = {
  padding: "5px 13px",
  borderRadius: "8px",
  border: `1px solid ${BRAND}`,
  background: CARD,
  color: BRAND_DEEP,
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const btnBack = {
  padding: "5px 12px",
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  background: CARD,
  color: MUTED,
  fontSize: "11px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

function joinNames(names, ar) {
  if (!names.length) return ar ? "لا أحد" : "no one";
  return names.join(ar ? " و" : ", ");
}

function promptText(ar, title, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = window.prompt(title, fallback || "");
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || fallback || "";
}

/** Platform.dc.html daily board L2342–2402 — literal chrome only. */
export default function StationDailyBoard({ lang, stationScope = "all" }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const [board, setBoard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const busyRef = useRef(false);

  const isOwner = !!(currentUser && (data?.ownerId === currentUser.id || currentUser.role === "owner"));
  const canFile = canFileDailyRole(currentUser?.role, isOwner);
  const canApprove = canApproveDailyRole(currentUser?.role, isOwner);

  const applyLocal = (snapshot) => {
    const local = snapshot || buildLocalDailyBoard(getCompanyData(company?.id) || data);
    setBoard(local);
    setLocalMode(true);
    return local;
  };

  const load = async () => {
    if (!company?.id) return;
    if (shouldUseLocalDaily() || isLocalPreviewActive()) {
      applyLocal();
      return;
    }
    try {
      const remote = await dailyReport({ action: "board", companyId: company.id });
      if (remote?.rows?.length) {
        setBoard(remote);
        setLocalMode(false);
      } else if ((data?.stations || []).length) {
        applyLocal();
      } else {
        setBoard(remote || { rows: [], summary: { total: 0, submitted: 0, late: 0, ready: 0, missing: 0 } });
      }
    } catch {
      applyLocal();
    }
  };

  useEffect(() => {
    load();
  }, [
    company?.id,
    data?.stations,
    data?.tasks,
    data?.reports,
    data?.safety,
    data?.personalAttendance,
    data?.workProofs,
    data?.signedDocuments,
    data?.signatureRequests,
  ]);

  const run = async (action, extra = {}) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (localMode || isLocalPreviewActive()) {
        if (action === "file" && extra.stationId) {
          const before = buildLocalDailyBoard(getCompanyData(company.id) || data);
          const target = before.rows.find((r) => String(r.stationId) === String(extra.stationId));
          const fileGate = checkFileDailyGate({
            role: currentUser?.role,
            owner: isOwner,
            stationId: extra.stationId,
            userStationId: currentUser?.stationId,
            managedStations: currentUser?.managedStations,
            report: target,
          });
          if (!fileGate.ok) {
            toast({ description: ar ? fileGate.reason : fileGate.reasonEn, variant: "destructive" });
            return;
          }
          const suggested = buildShortDailyNote(target?.facts || [], ar);
          const note = extra.note != null
            ? extra.note
            : promptText(
              ar,
              ar ? "ملاحظة قصيرة للوردية (اختياري — التفاصيل من المهام/الحضور تلقائيًا)" : "Short shift note (optional — facts come from tasks/attendance)",
              suggested,
            );
          if (note == null) return;
          const next = fileLocalDaily(company.id, extra.stationId, {
            name: currentUser?.name,
            note: String(note).slice(0, 160),
            facts: target?.facts,
            ar,
          });
          const row = next.rows.find((r) => String(r.stationId) === String(extra.stationId));
          applyLocal(next);
          toast({
            description: ar
              ? `رُفع تقرير ${row?.stationName || ""} الساعة ${row?.filedAt || ""} — بانتظار اعتماد العمليات`
              : `${row?.stationName || "Station"} report filed at ${row?.filedAt || ""} — awaiting ops approval`,
            variant: "success",
          });
          return;
        }
        if (action === "approve" && extra.stationId) {
          const roleGate = checkApproveDailyRoleGate(currentUser?.role, isOwner);
          if (!roleGate.ok) {
            toast({ description: ar ? roleGate.reason : roleGate.reasonEn, variant: "destructive" });
            return;
          }
          const before = buildLocalDailyBoard(getCompanyData(company.id) || data);
          const target = before.rows.find((r) => String(r.stationId) === String(extra.stationId));
          const next = approveLocalDaily(company.id, extra.stationId, { name: currentUser?.name });
          applyLocal(next);
          toast({
            description: ar
              ? `اعتُمد تقرير ${target?.stationName || ""} — يمكن إغلاق الوردية`
              : `${target?.stationName || "Station"} report approved — shift may close`,
            variant: "success",
          });
          return;
        }
        if (action === "return" && extra.stationId) {
          const roleGate = checkApproveDailyRoleGate(currentUser?.role, isOwner);
          if (!roleGate.ok) {
            toast({ description: ar ? roleGate.reason : roleGate.reasonEn, variant: "destructive" });
            return;
          }
          const before = buildLocalDailyBoard(getCompanyData(company.id) || data);
          const target = before.rows.find((r) => String(r.stationId) === String(extra.stationId));
          if (!target?.approved) {
            toast({
              description: ar ? "الإعادة للتصحيح بعد الاعتماد فقط." : "Return for correction is only after approval.",
              variant: "warning",
            });
            return;
          }
          const reason = extra.reason != null
            ? extra.reason
            : promptText(
              ar,
              ar ? "سبب الإعادة للتصحيح" : "Reason for return",
              ar ? "يلزم تصحيح" : "Needs correction",
            );
          if (reason == null) return;
          const next = returnLocalDaily(company.id, extra.stationId, {
            reason,
            name: currentUser?.name,
          });
          applyLocal(next);
          toast({
            description: ar
              ? `أُعيد تقرير ${target?.stationName || ""} للتصحيح — يُبلَّغ مُعِدّه بالسبب`
              : `${target?.stationName || "Station"} report returned for correction — its author is notified with the reason`,
            variant: "warning",
          });
          return;
        }
        if (action === "approveAll") {
          const roleGate = checkApproveDailyRoleGate(currentUser?.role, isOwner);
          if (!roleGate.ok) {
            toast({ description: ar ? roleGate.reason : roleGate.reasonEn, variant: "destructive" });
            return;
          }
          const scopeIds = stationScope === "all"
            ? null
            : new Set([String(stationScope)]);
          const b = buildLocalDailyBoard(getCompanyData(company.id) || data);
          const ready = b.rows.filter((r) => r.canApprove && (!scopeIds || scopeIds.has(String(r.stationId))));
          let next = b;
          for (const row of ready) {
            next = approveLocalDaily(company.id, row.stationId, { name: currentUser?.name });
          }
          applyLocal(next);
          const n = ready.length;
          toast({
            description: ar
              ? (n === 1 ? "اعتُمدت تقرير واحد في إجراء واحد" : n === 2 ? "اعتُمدت تقريران في إجراء واحد" : `اعتُمدت ${n} تقارير في إجراء واحد`)
              : `${n} report${n === 1 ? "" : "s"} approved in one action`,
            variant: "success",
          });
          return;
        }
        if (action === "chase") {
          const roleGate = checkApproveDailyRoleGate(currentUser?.role, isOwner);
          if (!roleGate.ok) {
            toast({ description: ar ? roleGate.reason : roleGate.reasonEn, variant: "destructive" });
            return;
          }
          const scopeIds = stationScope === "all" ? undefined : [stationScope];
          const result = chaseLocalDaily(company.id, { stationIds: scopeIds });
          applyLocal(result.board);
          toast({
            description: ar
              ? `أُرسل تنبيه إلى ${joinNames(result.names, true)} — التقرير مستحق منذ نهاية الوردية`
              : `Reminder sent to ${joinNames(result.names, false)} — the report is due since the shift ended`,
            variant: "success",
          });
          return;
        }
        if (action === "issueSigned") {
          const roleGate = checkApproveDailyRoleGate(currentUser?.role, isOwner);
          if (!roleGate.ok) {
            toast({ description: ar ? roleGate.reason : roleGate.reasonEn, variant: "destructive" });
            return;
          }
          const scopeIds = stationScope === "all" ? undefined : [stationScope];
          const issued = issueSignedLocalDaily(company.id, {
            name: currentUser?.name,
            stationIds: scopeIds,
          });
          if (issued.error) {
            toast({ description: ar ? issued.reason : issued.reasonEn, variant: "warning" });
            applyLocal(issued.board);
            return;
          }
          applyLocal(issued.board);
          const scopeName = stationScope === "all"
            ? (ar ? "الشركة" : "the company")
            : ((data?.stations || []).find((s) => String(s.id) === String(stationScope))?.name || (ar ? "الفرع" : "station"));
          toast({
            description: ar
              ? `صدرت حصيلة ${scopeName} لليوم موقّعة رقميًا — أُدرجت في الملفات`
              : `The signed daily record for ${scopeName} was issued — filed`,
            variant: "success",
          });
          return;
        }
        toast({
          description: ar ? "الإجراء غير متاح في الوضع المحلي." : "Action unavailable in local mode.",
          variant: "warning",
        });
        return;
      }
      const remote = await dailyReport({ action, companyId: company.id, ...extra });
      if (remote?.error) {
        toast({ description: ar ? remote.reason : (remote.reasonEn || remote.error), variant: "destructive" });
      } else {
        if (action === "file") {
          toast({
            description: ar
              ? `رُفع التقرير الساعة ${remote?.report?.filedAt || ""} — بانتظار الاعتماد`
              : `Report filed at ${remote?.report?.filedAt || ""} — awaiting approval`,
            variant: "success",
          });
        }
        if (action === "approve") {
          toast({ description: ar ? "اعتُمد التقرير." : "Report approved.", variant: "success" });
        }
        if (action === "return") {
          toast({
            description: ar
              ? "أُعيد التقرير للتصحيح — يُبلَّغ مُعِدّه بالسبب"
              : "Report returned for correction — author notified",
            variant: "warning",
          });
        }
        if (action === "approveAll") {
          const n = remote?.approved?.length || 0;
          toast({
            description: ar
              ? (n === 1 ? "اعتُمدت تقرير واحد في إجراء واحد" : `اعتُمدت ${n} تقارير في إجراء واحد`)
              : `${n} report${n === 1 ? "" : "s"} approved in one action`,
            variant: "success",
          });
        }
        if (action === "chase") {
          const names = remote?.chased || [];
          toast({
            description: ar
              ? `أُرسل تنبيه إلى ${joinNames(names, true)} — التقرير مستحق منذ نهاية الوردية`
              : `Reminder sent to ${joinNames(names, false)} — the report is due since the shift ended`,
            variant: "success",
          });
        }
        if (action === "issueSigned") {
          toast({
            description: ar
              ? "صدرت حصيلة اليوم موقّعة رقميًا — أُدرجت في الملفات"
              : "The signed daily record was issued — filed",
            variant: "success",
          });
        }
        await load();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!board) {
    return <p style={{ fontSize: "13px", color: MUTED }}>…</p>;
  }
  const allRows = board.rows || [];
  const rows = stationScope === "all"
    ? allRows
    : allRows.filter((row) => String(row.stationId ?? "") === String(stationScope));
  const s = stationScope === "all"
    ? (board.summary || {})
    : {
      total: rows.length,
      submitted: rows.filter((r) => r.filedAt && r.filedAt !== "—").length,
      late: rows.filter((r) => r.isLate).length,
      ready: rows.filter((r) => r.canApprove).length,
      missing: rows.filter((r) => r.missing).length,
      avgSubmitTime: (() => {
        const mins = rows
          .map((r) => {
            const m = String(r.filedAt || "").match(/^(\d{1,2}):(\d{2})$/);
            return m ? Number(m[1]) * 60 + Number(m[2]) : null;
          })
          .filter((n) => n != null);
        if (!mins.length) return "—";
        const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
        return `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
      })(),
    };

  const submittedComplete = (s.submitted || 0) === (s.total || 0) && (s.total || 0) > 0;
  const closableCount = rows.filter((r) => r.approved).length;
  const shiftBlocked = rows.length - closableCount;
  const dayKey = board.dateKey || new Date().toISOString().slice(0, 10);
  const alreadyIssuedToday = !!(data?.dailySignedRecords || []).some((r) => r && r.dateKey === dayKey);
  const issueGate = checkIssueSignedDailyGate({ rows, alreadyIssued: alreadyIssuedToday });

  return (
    <div style={pageCol} dir={ar ? "rtl" : "ltr"}>
      {/* 1) Platform L2344 — three summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "12px" }}>
        {[
          {
            label: ar ? "مرفوعة" : "Submitted",
            value: `${s.submitted || 0}/${s.total || 0}`,
            color: submittedComplete ? ACCENT : "#B45309",
          },
          {
            label: ar ? "متأخرة عن الوردية" : "Past shift end",
            value: `${s.late || 0}`,
            color: (s.late || 0) > 0 ? "#DC2626" : ACCENT,
          },
          {
            label: ar ? "متوسط وقت الرفع" : "Average submit time",
            value: s.avgSubmitTime || "—",
            color: NAVY,
          },
        ].map((c) => (
          <div key={c.label} style={statCard}>
            <div style={{ fontSize: "11px", color: MUTED }}>{c.label}</div>
            <div dir="ltr" style={{ ...num(c.color), marginTop: "8px" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        borderRadius: "11px",
        border: `1px solid ${shiftBlocked ? "#FDE68A" : BRAND_BORDER}`,
        background: shiftBlocked ? "#FFFBEB" : BRAND_SOFT,
        padding: "11px 14px",
        fontSize: "12px",
        color: shiftBlocked ? "#92400E" : BRAND_DEEP,
        lineHeight: 1.65,
      }}
      >
        {shiftBlocked
          ? (ar
            ? `إغلاق الوردية معلّق — ${shiftBlocked} فرع بلا اعتماد. الرفع لمدير الفرع · الاعتماد للعمليات.`
            : `Shift close held — ${shiftBlocked} station(s) not approved. Station manager files · ops approves.`)
          : (ar
            ? "كل التقارير معتمدة — الوردية قابلة للإغلاق. الحصيلة الموقّعة تُصدر مرة واحدة بعد الاعتماد الكامل."
            : "All reports approved — shifts may close. Signed record issues once after full approval.")}
        {localMode ? (ar ? " · وضع محلي." : " · Local mode.") : ""}
      </div>

      {/* 2) Platform L2352 — single station list card */}
      <ChromeBox padded={false}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
                {ar ? "تقارير اليوم" : "Today's reports"}
              </div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "3px" }}>
                {ar
                  ? "لا تُغلق الوردية قبل رفع التقرير واعتماده من المشرف. الملاحظة قصيرة — التفاصيل من المهام والحضور."
                  : "A shift cannot close before its report is filed and approved. Short note only — facts come from tasks and attendance."}
              </div>
            </div>
            {canApprove && s.missing > 0 && (
              <button type="button" disabled={busy} onClick={() => run("chase")} style={{ ...btnGhost, opacity: busy ? 0.4 : 1 }}>
                {ar ? `طالِب المتأخرين (${s.missing})` : `Chase outstanding (${s.missing})`}
              </button>
            )}
            {canApprove && s.ready > 0 && (
              <button type="button" disabled={busy} onClick={() => run("approveAll")} style={{ ...btnApproveAll, opacity: busy ? 0.4 : 1 }}>
                {ar ? `اعتمد الجاهزة (${s.ready})` : `Approve all ready (${s.ready})`}
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                disabled={busy || !issueGate.ok}
                title={!issueGate.ok ? (ar ? issueGate.reason : issueGate.reasonEn) : undefined}
                onClick={() => run("issueSigned")}
                style={{ ...ui.btnPrimary, opacity: busy || !issueGate.ok ? 0.4 : 1 }}
              >
                {alreadyIssuedToday
                  ? (ar ? "حُصيلة اليوم صدرت" : "Signed record issued")
                  : (ar ? "أصدر حصيلة اليوم موقّعة" : "Issue the signed daily record")}
              </button>
            )}
          </div>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "26px 18px", textAlign: "center", fontSize: "12px", color: MUTED }}>
            {stationScope === "all"
              ? (ar ? "لا فروع على لوح اليوم." : "No stations on today's board.")
              : (ar ? "لا تقرير لهذا الفرع اليوم — بدّل الفرع أو اختر كل الفروع." : "No report for this station today — switch station or pick all stations.")}
          </div>
        )}
        {rows.map((row) => {
          const st = STATUS[row.status] || STATUS.missing;
          return (
            <div
              key={row.stationId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                borderBottom: "1px solid #F1F5F9",
                flexWrap: "wrap",
              }}
            >
              <div style={{ width: "96px", flexShrink: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{row.stationName}</div>
                <div dir="ltr" style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                  {row.filedAt}
                </div>
              </div>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: NAVY, textWrap: "pretty" }}>
                  {row.note || (row.missing
                    ? (ar ? "لم يُرفع بعد · بانتظار الرفع" : "Not submitted · awaiting filing")
                    : (ar ? "تقرير مرفوع" : "Report filed"))}
                </div>
                <div style={{ fontSize: "11px", color: MUTED, marginTop: "3px" }}>
                  {ar ? "رفعه" : "SUBMITTED BY"} · {row.filedBy || "—"}
                </div>
                {row.returnReason && !row.approved && (
                  <div style={{ fontSize: "11px", color: "#B45309", marginTop: "3px" }}>
                    {ar ? "سبب الإعادة" : "Return reason"} · {row.returnReason}
                  </div>
                )}
                <div style={{ display: "flex", gap: "7px", marginTop: "8px", flexWrap: "wrap" }}>
                  {(row.facts || []).map((f) => {
                    const meta = FACT_META[f.id];
                    if (!meta) return null;
                    const hot = f.bad && f.value > 0;
                    const label = (ar ? meta.ar : meta.en)[f.value === 1 ? 0 : 1];
                    return (
                      <Link
                        key={f.id}
                        to={meta.to}
                        style={{
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: "6px",
                          padding: "5px 10px",
                          borderRadius: "8px",
                          border: hot ? "1px solid #FECACA" : "1px solid #E2E8F0",
                          background: hot ? "#FEF2F2" : "#F7F8FA",
                          color: hot ? "#B91C1C" : MUTED,
                          fontSize: "11px",
                          textDecoration: "none",
                          fontFamily: "inherit",
                        }}
                      >
                        <span dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "13px", fontWeight: 600, color: hot ? "#B91C1C" : NAVY }}>
                          {f.value}
                        </span>
                        <span style={{ whiteSpace: "nowrap" }}>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <span style={st.style}>{ar ? st.ar : st.en}</span>
              {row.lateChip && (
                <span style={pill("#FEF2F2", "#B91C1C", "#FECACA")}>
                  {ar ? "رُفع متأخرًا" : "Filed late"}
                </span>
              )}
              {(() => {
                const closeGate = checkCloseShiftDailyGate({
                  filedAt: row.filedAt === "—" ? null : row.filedAt,
                  approved: row.approved,
                });
                return (
                  <span style={pill(
                    closeGate.ok ? "#ECFDF5" : "#FFFBEB",
                    closeGate.ok ? "#14683F" : "#92400E",
                    closeGate.ok ? "#A7F3D0" : "#FDE68A",
                  )}
                  >
                    {closeGate.ok
                      ? (ar ? "وردية قابلة للإغلاق" : "Shift closable")
                      : (ar ? "وردية مفتوحة" : "Shift open")}
                  </span>
                );
              })()}
              {row.missing && canFile && (
                <button type="button" disabled={busy} onClick={() => run("file", { stationId: row.stationId })} style={{ ...btnAct, opacity: busy ? 0.4 : 1 }}>
                  {ar ? "ارفع التقرير الآن" : "File the report now"}
                </button>
              )}
              {canApprove && row.canApprove && (
                <button type="button" disabled={busy} onClick={() => run("approve", { stationId: row.stationId })} style={{ ...btnAct, opacity: busy ? 0.4 : 1 }}>
                  {ar ? "اعتمد" : "Approve"}
                </button>
              )}
              {canApprove && row.approved && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("return", { stationId: row.stationId })}
                  style={{ ...btnBack, opacity: busy ? 0.4 : 1 }}
                >
                  {ar ? "أعِده للتصحيح" : "Return for correction"}
                </button>
              )}
            </div>
          );
        })}
      </ChromeBox>

      <p style={{ margin: 0, fontSize: "11px", color: MUTED }}>
        {ar
          ? "اعتماد تقرير متأخر لا يمحو علامة التأخير — الحقلان منفصلان. الحصيلة الموقّعة مرة واحدة يوميًا بعد اعتماد الكل."
          : "Approving a late report never clears lateness. Signed record once per day after every approval."}
      </p>
    </div>
  );
}
