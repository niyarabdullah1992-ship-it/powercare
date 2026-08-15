import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { PERF_WEIGHTS, scoreBoard, aggregateStationBoard } from "@/lib/perfDerivations";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import { visibleStations } from "@/lib/permissions";
import { ACCENT, MUTED, NAVY, NAVY_FILL, bar, tableShell, CARD, SURFACE } from "@/lib/platformStyles";
import EmployeeIdentityRow from "@/components/employees/EmployeeIdentityRow";
import { ChromeBox } from "@/components/shared/IdentityCard";

async function scores(payload) {
  const res = await base44.functions.invoke("scores", payload);
  return res?.data ?? res;
}

const peopleHead = {
  display: "grid",
  gridTemplateColumns: "28px minmax(180px,1.7fr) 84px 84px 78px 104px 120px",
  gap: "12px",
  padding: "10px 18px",
  background: SURFACE,
  borderTop: "1px solid #E2E8F0",
  borderBottom: "1px solid #E2E8F0",
  fontSize: "10px",
  letterSpacing: "0.06em",
  color: MUTED,
  fontWeight: 600,
};

const peopleRow = {
  display: "grid",
  gridTemplateColumns: "28px minmax(180px,1.7fr) 84px 84px 78px 104px 120px",
  gap: "12px",
  padding: "12px 18px",
  borderBottom: "1px solid #F1F5F9",
  alignItems: "center",
  color: "inherit",
};

const stationHead = {
  ...peopleHead,
  gridTemplateColumns: "28px minmax(160px,1.6fr) 64px 84px 84px 78px 104px 120px",
};

const stationRowStyle = {
  ...peopleRow,
  gridTemplateColumns: "28px minmax(160px,1.6fr) 64px 84px 84px 78px 104px 120px",
};

const chipBtn = {
  height: "30px",
  padding: "0 12px",
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  background: CARD,
  color: NAVY,
  fontSize: "12px",
  fontFamily: "inherit",
  cursor: "pointer",
};

const matrixHead = {
  padding: "10px 12px",
  background: SURFACE,
  borderBottom: "1px solid #E2E8F0",
  fontSize: "11px",
  fontWeight: 600,
  color: MUTED,
  textAlign: "start",
};

const matrixCell = {
  padding: "10px 12px",
  borderBottom: "1px solid #F1F5F9",
  fontSize: "13px",
  color: NAVY,
};

/** Platform performance — navy score + formula panel + individual table (L1528+). */
export default function PerfScoreBoard({ lang, overallPct }) {
  const { company, data, currentUser } = useAuth();
  const ar = lang === "ar";
  const scope = useStationScope();
  const [board, setBoard] = useState([]);
  const [source, setSource] = useState("local");
  const [hoverRow, setHoverRow] = useState(null);
  const [compare, setCompare] = useState("people");
  const [picked, setPicked] = useState([]);
  const MAX_PICK = 6;

  const stationsInView = useMemo(
    () => (currentUser && data ? visibleStations(currentUser, data) : data?.stations || []),
    [currentUser, data],
  );

  useEffect(() => {
    if (!data?.employees) return;
    const allowed = new Set(stationsInView.map((s) => s.id));
    const inPermission = (stationId) => (allowed.size ? allowed.has(stationId) : matchesStationScope(stationId, scope));
    const localRows = data.employees.filter((e) => inPermission(e.stationId)).map((e) => ({
      employeeId: e.id,
      name: e.name,
      stationId: e.stationId,
      pts: e.points || 0,
      ontimePct: 80,
      closure: 0,
      reportPts: 0,
      coverPts: 0,
    }));
    setBoard(scoreBoard(localRows));
    setSource("local");
    if (!company?.id) return;
    scores({ action: "perfBoard", companyId: company.id })
      .then((remote) => {
        if (Array.isArray(remote?.board) && remote.board.length) {
          const rows = remote.board.filter((r) => inPermission(r.stationId));
          setBoard(rows);
          setSource("server");
        }
      })
      .catch(() => {});
  }, [company?.id, data?.employees, scope, stationsInView]);

  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || "—";

  const peopleRows = useMemo(
    () => board.filter((r) => matchesStationScope(r.stationId, scope)).map((row, i) => ({ ...row, rank: i + 1 })),
    [board, scope],
  );
  const stationRows = useMemo(
    () => aggregateStationBoard(board, stationsInView),
    [board, stationsInView],
  );
  const leadPeople = peopleRows[0]?.score ?? 0;
  const leadStation = stationRows[0]?.score ?? 0;

  useEffect(() => {
    setPicked([]);
  }, [compare, scope]);

  const pool = compare === "stations" ? stationRows : peopleRows;
  const idOf = (row) => (compare === "stations" ? row.stationId : row.employeeId);
  const pickedRows = useMemo(
    () => pool.filter((row) => picked.includes(idOf(row))),
    [pool, picked, compare],
  );

  const togglePick = (id) => {
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_PICK) return cur;
      return [...cur, id];
    });
  };
  const pickTop = (n) => setPicked(pool.slice(0, n).map(idOf));
  const pickAllStations = () => setPicked(stationRows.map((r) => r.stationId).slice(0, MAX_PICK));

  const metricDefs = compare === "stations"
    ? [
        { key: "score", label: ar ? "الدرجة" : "Score", fmt: (v) => v },
        { key: "heads", label: ar ? "عدد الموظفين" : "Headcount", fmt: (v) => v },
        { key: "ptsPct", label: ar ? "الإنجاز" : "Done", fmt: (v) => `${v}%` },
        { key: "ontime", label: ar ? "في الموعد" : "On time", fmt: (v) => `${v}%` },
        { key: "hse", label: ar ? "السلامة" : "Safety", fmt: (v) => `${v}%` },
        { key: "pts", label: ar ? "النقاط" : "Points", fmt: (v) => v },
      ]
    : [
        { key: "score", label: ar ? "الدرجة" : "Score", fmt: (v) => v },
        { key: "ptsPct", label: ar ? "الإنجاز" : "Done", fmt: (v) => `${v ?? 0}%` },
        { key: "ontime", label: ar ? "في الموعد" : "On time", fmt: (v) => `${v ?? 0}%` },
        { key: "hse", label: ar ? "السلامة" : "Safety", fmt: (v) => `${v ?? 0}%` },
        { key: "pts", label: ar ? "النقاط" : "Points", fmt: (v) => v ?? 0 },
      ];

  const bestOf = (key) => {
    if (!pickedRows.length) return null;
    return Math.max(...pickedRows.map((r) => Number(r[key]) || 0));
  };

  const tabWrap = {
    display: "inline-flex",
    padding: "3px",
    borderRadius: "10px",
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    gap: "2px",
    flexShrink: 0,
  };
  const tabBtn = (active) => ({
    height: "32px",
    padding: "0 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: active ? 600 : 500,
    background: active ? CARD : "transparent",
    color: active ? NAVY : MUTED,
    boxShadow: active ? "0 1px 3px rgba(20,40,75,.10)" : "none",
  });
  const gapLabel = (score, lead) => {
    if (!lead && !score) return "—";
    if (score === lead) return ar ? "الأعلى" : "Lead";
    return `−${lead - score}`;
  };

  const companyScore = useMemo(() => {
    if (typeof overallPct === "number") return overallPct;
    if (!board.length) return 0;
    return Math.round(board.reduce((s, r) => s + (r.score || 0), 0) / board.length);
  }, [board, overallPct]);

  const drivers = [
    { label: ar ? "نقاط المهام" : "Task points", value: Math.round(PERF_WEIGHTS.pts * 100), pct: PERF_WEIGHTS.pts },
    { label: ar ? "الالتزام بالموعد" : "On-time", value: Math.round(PERF_WEIGHTS.ontime * 100), pct: PERF_WEIGHTS.ontime },
    { label: ar ? "السلامة" : "Safety", value: Math.round(PERF_WEIGHTS.hse * 100), pct: PERF_WEIGHTS.hse },
    { label: ar ? "تغطية الورديات" : "Shift coverage", value: Math.round(PERF_WEIGHTS.cover * 100), pct: PERF_WEIGHTS.cover },
  ];

  const shares = [
    {
      pct: `${Math.round(PERF_WEIGHTS.pts * 100)}%`,
      label: ar ? "نقاط المهام المعتمدة" : "Approved task points",
      note: ar ? "تُحسب بعد اعتماد الإثبات فقط — لا نقاط بلا أثر." : "Counted only after proof approval — no points without a trace.",
    },
    {
      pct: `${Math.round(PERF_WEIGHTS.ontime * 100)}%`,
      label: ar ? "الالتزام بالموعد" : "On-time delivery",
      note: ar ? "نسبة الإنجاز قبل الاستحقاق ضمن النطاق." : "Share of completions before due within scope.",
    },
    {
      pct: `${Math.round(PERF_WEIGHTS.hse * 100)}%`,
      label: ar ? "السلامة (إغلاق + بلاغات)" : "Safety (closure + reports)",
      note: ar ? "مزيج إغلاق المخاطر ونقاط البلاغات — ليس الحضور." : "Hazard closure blended with report points — not attendance.",
    },
    {
      pct: `${Math.round(PERF_WEIGHTS.cover * 100)}%`,
      label: ar ? "تغطية الورديات" : "Shift coverage",
      note: ar ? "مساهمة تغطية الجدول المنشور." : "Contribution from published roster coverage.",
    },
  ];

  const periodLabel = new Intl.DateTimeFormat(ar ? "ar" : "en", { month: "long", year: "numeric" }).format(new Date());

  const shareRow = {
    display: "flex",
    gap: "12px",
    padding: "10px 0",
    borderTop: "1px solid #F1F5F9",
    alignItems: "flex-start",
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1320px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "stretch" }}>
        {/* Navy score card — L1531 */}
        <div style={{ flex: "1 1 288px", maxWidth: "352px", background: NAVY_FILL, borderRadius: "16px", padding: "22px", color: "#fff" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#6EE7B7", fontWeight: 600 }}>
            {ar ? "درجة الشركة" : "COMPANY SCORE"}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500, marginTop: "8px" }}>{periodLabel}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "14px" }}>
            <span
              dir="ltr"
              style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "56px", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}
            >
              {companyScore}
            </span>
            <span dir="ltr" style={{ fontSize: "16px", color: "#A8B4C8" }}>/100</span>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,.12)", margin: "20px 0 12px" }} />
          <div style={{ fontSize: "10px", letterSpacing: "0.06em", color: "#A8B4C8", fontWeight: 600, marginBottom: "12px" }}>
            {ar ? "محركات الدرجة" : "SCORE DRIVERS"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {drivers.map((d) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ flex: 1, fontSize: "12px", color: "#A8B4C8" }}>{d.label}</span>
                <span style={{ width: "74px", height: "4px", borderRadius: "4px", background: "rgba(255,255,255,.1)", overflow: "hidden", flexShrink: 0 }}>
                  <span style={bar(d.value, "#6EE7B7")} />
                </span>
                <span dir="ltr" style={{ width: "34px", textAlign: "right", fontSize: "11px", fontFamily: "'IBM Plex Sans',sans-serif", color: "#E2E8F0" }}>
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Formula panel — L1551 */}
        <ChromeBox padded={false} style={{ flex: "999 1 440px" }}>
          <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {ar ? "صيغة الأداء الثابتة" : "Fixed performance formula"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.65 }}>
              {ar
                ? "الحضور ليس بندًا في الدرجة — الإثبات المعتمد هو المصدر."
                : "Attendance is not a score term — approved proof is the source."}
              <span style={{ marginInlineStart: "8px", opacity: 0.75 }}>
                {source === "server"
                  ? (ar ? "· الدرجة محتسبة على الخادم" : "· scored on the server")
                  : (ar ? "· تقدير أوّلي من بيانات هذا الجهاز — غير معتمد" : "· provisional from on-device data — not approved")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              {shares.map((sh) => (
                <div key={sh.label} style={shareRow}>
                  <span style={{ width: "40px", flexShrink: 0, fontSize: "12px", fontWeight: 600, color: ACCENT }} dir="ltr">{sh.pct}</span>
                  <span style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: NAVY }}>{sh.label}</span>
                    <span style={{ display: "block", fontSize: "11px", color: MUTED, lineHeight: 1.6, marginTop: "2px" }}>{sh.note}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "12px", padding: "11px 13px", borderRadius: "10px", background: SURFACE, border: "1px solid #E2E8F0", lineHeight: 1.7 }}>
              {ar
                ? "حماية انتقالية: إذا كانت الصيغة السابقة أعلى تُحفَظ الدرجة مؤقتًا حتى يتجاوزها الموظف."
                : "Transitional guard: if the prior formula scored higher, that score is held until the employee surpasses it."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: MUTED }}>
                {ar ? "الإصدار: v2 — بدون حضور" : "Policy: v2 — attendance excluded"}
              </span>
            </div>
          </div>
        </ChromeBox>
      </div>

      <div style={tableShell}>
        <div style={{ padding: "16px 18px 12px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {compare === "stations"
                ? (ar ? "مقارنة الفروع" : "Station comparison")
                : (ar ? "مقارنة الموظفين" : "Employee comparison")}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px", lineHeight: 1.55 }}>
              {ar
                ? `حدّد اثنين حتى ${MAX_PICK} للمقارنة جنبًا إلى جنب — أو استخدم الاختصار أعلى القائمة.`
                : `Select 2–${MAX_PICK} to compare side by side — or use the shortcuts above the list.`}
            </div>
          </div>
          <div style={tabWrap} role="tablist" aria-label={ar ? "نوع المقارنة" : "Comparison type"}>
            <button type="button" role="tab" aria-selected={compare === "people"} style={tabBtn(compare === "people")} onClick={() => setCompare("people")}>
              {ar ? "الموظفون" : "People"}
            </button>
            <button type="button" role="tab" aria-selected={compare === "stations"} style={tabBtn(compare === "stations")} onClick={() => setCompare("stations")}>
              {ar ? "الفروع" : "Stations"}
            </button>
          </div>
        </div>

        <div style={{ padding: "0 18px 12px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          {compare === "people" ? (
            <>
              <button type="button" style={chipBtn} onClick={() => pickTop(2)}>{ar ? "أعلى 2" : "Top 2"}</button>
              <button type="button" style={chipBtn} onClick={() => pickTop(3)}>{ar ? "أعلى 3" : "Top 3"}</button>
              <button type="button" style={chipBtn} onClick={() => pickTop(5)}>{ar ? "أعلى 5" : "Top 5"}</button>
            </>
          ) : (
            <>
              <button type="button" style={chipBtn} onClick={() => pickTop(2)}>{ar ? "أعلى فرعين" : "Top 2 stations"}</button>
              <button type="button" style={chipBtn} onClick={pickAllStations}>{ar ? "كل الفروع الظاهرة" : "All visible stations"}</button>
            </>
          )}
          <button type="button" style={{ ...chipBtn, color: MUTED }} onClick={() => setPicked([])} disabled={!picked.length}>
            {ar ? "مسح التحديد" : "Clear"}
          </button>
          <span style={{ fontSize: "11px", color: MUTED, marginInlineStart: "auto" }}>
            {picked.length}/{MAX_PICK} {ar ? "محدد" : "selected"}
          </span>
        </div>

        {picked.length === 1 && (
          <div style={{ margin: "0 18px 12px", padding: "10px 12px", borderRadius: "10px", background: SURFACE, border: "1px solid #E2E8F0", fontSize: "12px", color: MUTED }}>
            {ar ? "اختر واحداً آخر على الأقل لبدء المقارنة." : "Select at least one more to start the comparison."}
          </div>
        )}

        {pickedRows.length >= 2 && (
          <div style={{ margin: "0 18px 16px", overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 160 + pickedRows.length * 140 }}>
              <thead>
                <tr>
                  <th style={matrixHead}>{ar ? "المؤشر" : "Metric"}</th>
                  {pickedRows.map((row) => (
                    <th key={idOf(row)} style={{ ...matrixHead, textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{row.name}</div>
                      <div style={{ fontSize: "10px", color: MUTED, fontWeight: 500, marginTop: 2 }}>
                        {compare === "stations"
                          ? (row.heads ? (ar ? `${row.heads} موظف` : `${row.heads} people`) : "—")
                          : stationName(row.stationId)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricDefs.map((m) => {
                  const best = bestOf(m.key);
                  return (
                    <tr key={m.key}>
                      <td style={matrixCell}>{m.label}</td>
                      {pickedRows.map((row) => {
                        const val = Number(row[m.key]) || 0;
                        const win = val === best && pickedRows.length > 1;
                        return (
                          <td
                            key={idOf(row) + m.key}
                            dir="ltr"
                            style={{
                              ...matrixCell,
                              textAlign: "center",
                              fontFamily: "'IBM Plex Sans',sans-serif",
                              fontWeight: win ? 600 : 500,
                              color: win ? ACCENT : NAVY,
                            }}
                          >
                            {m.fmt(row[m.key])}
                            {m.key === "score" && (
                              <span style={{ display: "block", height: 4, marginTop: 6, borderRadius: 4, background: "#F1F5F9", overflow: "hidden" }}>
                                <span style={bar(val, win ? ACCENT : "#94A3B8")} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          {compare === "stations" ? (
            <div style={{ minWidth: "820px" }}>
              <div style={stationHead}>
                <div />
                <div>{ar ? "الفرع" : "STATION"}</div>
                <div>{ar ? "العدد" : "HEADS"}</div>
                <div>{ar ? "الإنجاز" : "DONE"}</div>
                <div>{ar ? "في الموعد" : "ON TIME"}</div>
                <div>{ar ? "السلامة" : "SAFETY"}</div>
                <div>{ar ? "النقاط" : "POINTS"}</div>
                <div>{ar ? "الدرجة" : "SCORE"}</div>
              </div>
              {!stationRows.length ? (
                <div style={{ padding: "22px 18px", textAlign: "center", fontSize: "12px", color: MUTED }}>
                  {ar ? "لا فروع ظاهرة للمقارنة" : "No stations in scope to compare"}
                </div>
              ) : (
                stationRows.map((r) => {
                  const on = picked.includes(r.stationId);
                  return (
                    <label
                      key={r.stationId}
                      style={{
                        ...stationRowStyle,
                        background: on ? "#F0FDF4" : hoverRow === r.stationId ? "#F7F8FA" : undefined,
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHoverRow(r.stationId)}
                      onMouseLeave={() => setHoverRow(null)}
                    >
                      <input type="checkbox" checked={on} onChange={() => togglePick(r.stationId)} style={{ width: 15, height: 15, accentColor: ACCENT }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span dir="ltr" style={{ width: "22px", flexShrink: 0, fontSize: "11px", fontWeight: 600, color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                          {r.rank}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                          <div style={{ fontSize: "11px", color: MUTED }}>
                            {r.heads ? (ar ? `${r.heads} موظف` : `${r.heads} people`) : (ar ? "بدون درجات بعد" : "No scores yet")}
                          </div>
                        </div>
                      </div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.heads}</div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.ptsPct}%</div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.ontime}%</div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.hse}%</div>
                      <div dir="ltr" style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right", color: NAVY }}>{r.pts}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ flex: 1, height: "5px", borderRadius: "4px", background: "#F1F5F9", overflow: "hidden" }}>
                            <span style={bar(r.score || 0, ACCENT)} />
                          </span>
                          <span dir="ltr" style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", width: "24px", textAlign: "right", color: NAVY }}>
                            {r.score}
                          </span>
                        </div>
                        <div dir="ltr" style={{ fontSize: "10px", color: r.rank === 1 ? ACCENT : MUTED, textAlign: ar ? "left" : "right" }}>
                          {gapLabel(r.score, leadStation)}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          ) : (
            <div style={{ minWidth: "780px" }}>
              <div style={peopleHead}>
                <div />
                <div>{ar ? "الموظف" : "EMPLOYEE"}</div>
                <div>{ar ? "الإنجاز" : "DONE"}</div>
                <div>{ar ? "في الموعد" : "ON TIME"}</div>
                <div>{ar ? "السلامة" : "SAFETY"}</div>
                <div>{ar ? "النقاط" : "POINTS"}</div>
                <div>{ar ? "الدرجة" : "SCORE"}</div>
              </div>
              {!peopleRows.length ? (
                <div style={{ padding: "22px 18px", textAlign: "center", fontSize: "12px", color: MUTED }}>
                  {ar ? "لا بيانات بعد في هذا النطاق" : "No scores yet in this scope"}
                </div>
              ) : (
                peopleRows.map((r) => {
                  const on = picked.includes(r.employeeId);
                  return (
                    <div
                      key={r.employeeId}
                      style={{
                        ...peopleRow,
                        cursor: "default",
                        background: on ? "#F0FDF4" : hoverRow === r.employeeId ? "#F7F8FA" : undefined,
                      }}
                      onMouseEnter={() => setHoverRow(r.employeeId)}
                      onMouseLeave={() => setHoverRow(null)}
                    >
                      <input type="checkbox" checked={on} onChange={() => togglePick(r.employeeId)} style={{ width: 15, height: 15, accentColor: ACCENT }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span dir="ltr" style={{ width: "22px", flexShrink: 0, fontSize: "11px", fontWeight: 600, color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                          {r.rank}
                        </span>
                        <EmployeeIdentityRow
                          employeeId={r.employeeId}
                          name={r.name}
                          subtitle={stationName(r.stationId)}
                          showId={false}
                          compact
                        />
                      </div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.ptsPct ?? 0}%</div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.ontime ?? 0}%</div>
                      <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>{r.hse ?? 0}%</div>
                      <div dir="ltr" style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right", color: NAVY }}>{r.pts ?? 0}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ flex: 1, height: "5px", borderRadius: "4px", background: "#F1F5F9", overflow: "hidden" }}>
                            <span style={bar(r.score || 0, ACCENT)} />
                          </span>
                          <span dir="ltr" style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", width: "24px", textAlign: "right", color: NAVY }}>{r.score ?? 0}</span>
                        </div>
                        <div dir="ltr" style={{ fontSize: "10px", color: r.rank === 1 ? ACCENT : MUTED, textAlign: ar ? "left" : "right" }}>
                          {gapLabel(r.score ?? 0, leadPeople)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
