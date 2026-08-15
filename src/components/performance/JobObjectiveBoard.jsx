import React, { useEffect, useState } from "react";
import { hcmCall } from "@/lib/hcmApi";
import { useAuth } from "@/lib/PowerCareAuth";
import { toast } from "@/components/ui/use-toast";
import useStationScope from "@/hooks/useStationScope";
import { OBJECTIVE_SOURCE_LABELS } from "@/lib/hcmDerivations";
import { personJobTitle } from "@/lib/smartPositions";
import ReviewCyclePanel from "@/components/performance/ReviewCyclePanel";
import { ACCENT, MUTED, NAVY, bar, cardShell, tableShell, SURFACE } from "@/lib/platformStyles";

const gridCols = "minmax(150px,1.5fr) minmax(110px,1fr) 76px 84px minmax(120px,1fr) 76px";

const headRow = {
  display: "grid",
  gridTemplateColumns: gridCols,
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

const bodyRow = {
  display: "grid",
  gridTemplateColumns: gridCols,
  gap: "12px",
  padding: "12px 18px",
  borderBottom: "1px solid #F1F5F9",
  alignItems: "center",
  cursor: "pointer",
};

/** Job-weighted objectives — approved task weight rolled into a scored plan per job. */
export default function JobObjectiveBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const scope = useStationScope();
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState("");

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin", "hr_manager"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await hcmCall({
        action: "objectiveBoard",
        companyId: company.id,
        companyName: company.name,
        ...(scope !== "all" ? { stationId: scope } : {}),
      });
      if (remote?.ok) {
        setState(remote);
        setLoadError("");
        return;
      }
      setLoadError(ar ? (remote?.reason || "") : (remote?.reasonEn || ""));
      setState({ board: [], jobs: [], plans: {} });
    } catch {
      // Keep the weighting rules on screen even when the service is unreachable —
      // a bare error string hides the spine of task → weight → performance.
      setLoadError(ar
        ? "خطط أهداف الوظائف غير متصلة — لم تستجب خدمة HCM. الأوزان أدناه غير محمَّلة ولا تُعتمد درجة حتى تعود الخدمة."
        : "Job goal plans are offline — the HCM service did not respond. Weights below are not loaded and no score is approved until it returns.");
      setState({ board: [], jobs: [], plans: {} });
    }
  };

  useEffect(() => { load(); }, [company?.id, scope]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return false;
    setBusy(true);
    try {
      const remote = await hcmCall({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({ description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error), variant: "destructive" });
        return false;
      }
      if (okMsg) toast({ description: okMsg });
      await load();
      return true;
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const liveJobTitle = (employeeId, fallback) => {
    const employee = (data?.employees || []).find((item) => item.id === employeeId);
    const position = (data?.smartPositions || []).find((item) => item.employeeId === employeeId);
    return personJobTitle(employee, position) || fallback || "";
  };

  const board = state?.board || [];

  const companyScore = board.length ? Math.round(board.reduce((n, r) => n + r.score, 0) / board.length) : 0;

  if (!state) {
    return <div style={{ ...cardShell, fontSize: "12px", color: MUTED }}>{ar ? "تُحمَّل أهداف الوظائف…" : "Loading job objectives…"}</div>;
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }} dir={ar ? "rtl" : "ltr"}>
      {loadError ? (
        <div style={{
          borderRadius: "12px",
          border: "1px solid #FDE68A",
          background: "#FFFBEB",
          padding: "12px 16px",
          fontSize: "12px",
          lineHeight: 1.7,
          color: "#B45309",
        }}
        >
          <span style={{ fontWeight: 600 }}>{ar ? "الدرجة موقوفة · " : "Scoring held · "}</span>
          {loadError}
        </div>
      ) : null}
      {/* formula — derived, not typed */}
      <div style={cardShell}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {ar ? "أهداف الوظيفة — وزن المهمة يقود الدرجة" : "Job objectives — task weight drives the score"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.75, maxWidth: "860px" }}>
              {ar
                ? "لا أرقام مكتوبة يدويًا: وزن المهمة المعتمدة (الأولوية × الجهد) هو ما يُملأ به كل هدف من نوع «مهام»، وبقية الأهداف نسب مشتقة."
                : "No typed figures: approved task weight (priority × effort) fills every task objective, and the remaining objectives are derived rates."}
            </div>
          </div>
          <div style={{ textAlign: ar ? "left" : "right" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.06em", color: MUTED, fontWeight: 600 }}>
              {ar ? "متوسط الدرجة الموزونة" : "AVG WEIGHTED SCORE"}
            </div>
            <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "30px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
              {companyScore}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: SURFACE, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "12px", color: NAVY, lineHeight: 1.8 }}>
            {ar
              ? "الدرجة = مجموع (الإنجاز × الوزن) ÷ 100"
              : "score = Σ (attainment × weight) ÷ 100"}
          </div>
          <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.8 }}>
            {ar
              ? "إنجاز المهام = مجموع (الأولوية × الجهد المعتمد) ÷ الهدف"
              : "task attainment = Σ (priority × approved effort) ÷ target"}
          </div>
          <div style={{ fontSize: "11px", color: MUTED, lineHeight: 1.7 }}>
            {ar
              ? "الهدف إما رقم مطلق في الخطة أو أعلى وزن مثبت بين الزملاء في النطاق نفسه. المهمة غير المعتمدة لا تدخل الحساب."
              : "The target is either an absolute number in the plan or the highest proven weight among peers in the same scope. Unapproved work never counts."}
          </div>
        </div>
      </div>

      {/* board */}
      <div style={tableShell}>
        <div style={{ padding: "16px 18px 12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "لوحة الأهداف" : "Objective board"}</div>
          <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>
            {ar ? "اضغط أي صف لعرض تفكيك الأهداف" : "Select a row to open the objective breakdown"}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "760px" }}>
            <div style={headRow}>
              <div>{ar ? "الموظف" : "EMPLOYEE"}</div>
              <div>{ar ? "الوظيفة" : "JOB"}</div>
              <div>{ar ? "الوزن" : "WEIGHT"}</div>
              <div>{ar ? "مهام مُثبتة" : "PROVEN"}</div>
              <div>{ar ? "الدرجة الموزونة" : "WEIGHTED"}</div>
              <div>{ar ? "التقييم" : "RATING"}</div>
            </div>
            {board.length === 0 ? (
              <div style={{ padding: "22px 18px", textAlign: "center", fontSize: "12px", color: MUTED }}>
                {ar ? "لا بيانات في هذا النطاق." : "No data in this scope."}
              </div>
            ) : board.map((r) => (
              <div key={r.employeeId}>
                <div
                  role="button"
                  tabIndex={0}
                  style={bodyRow}
                  onClick={() => setExpanded(expanded === r.employeeId ? "" : r.employeeId)}
                  onKeyDown={(e) => { if (e.key === "Enter") setExpanded(expanded === r.employeeId ? "" : r.employeeId); }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: "10px", color: MUTED }}>
                      {r.positionRef ? `${r.positionRef} · ` : ""}
                      {r.orgUnitName || (ar ? "بلا وحدة" : "no unit")}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: MUTED }}>
                    {liveJobTitle(r.employeeId, r.jobTitle) || (ar ? "بلا وظيفة" : "No job")}
                    {!r.planCustom ? (
                      <span style={{ display: "block", fontSize: "10px", color: "#B45309" }}>{ar ? "الخطة الافتراضية" : "default plan"}</span>
                    ) : null}
                  </div>
                  <div dir="ltr" style={{ fontSize: "12px", fontFamily: "'IBM Plex Sans',sans-serif", color: NAVY, textAlign: ar ? "right" : "left" }}>{r.points}</div>
                  <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: ar ? "right" : "left" }}>
                    {r.provenTasks}/{r.assignedTasks}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ flex: 1, height: "5px", borderRadius: "4px", background: "#F1F5F9", overflow: "hidden" }}>
                      <span style={bar(r.score, ACCENT)} />
                    </span>
                    <span dir="ltr" style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", width: "24px", textAlign: "right", color: NAVY }}>{r.score}</span>
                  </div>
                  <div dir="ltr" style={{ fontSize: "12px", fontFamily: "'IBM Plex Sans',sans-serif", color: r.rating == null ? MUTED : ACCENT, textAlign: ar ? "right" : "left" }}>
                    {r.rating == null ? "—" : r.rating}
                  </div>
                </div>
                {expanded === r.employeeId && (
                  <div style={{ padding: "12px 18px 16px", background: SURFACE, borderBottom: "1px solid #E2E8F0" }}>
                    {r.objectives.map((o) => (
                      <div key={o.objectiveId} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "7px 0", flexWrap: "wrap" }}>
                        <span style={{ flex: "1 1 170px", fontSize: "11px", color: NAVY }}>
                          {ar ? OBJECTIVE_SOURCE_LABELS[o.source]?.ar || o.source : OBJECTIVE_SOURCE_LABELS[o.source]?.en || o.source}
                          <span style={{ color: MUTED }}> · {o.weight}%</span>
                        </span>
                        <span dir="ltr" style={{ flex: "0 0 110px", fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                          {o.source === "task" ? `${o.earned} / ${o.target}` : `${o.attainmentPct}%`}
                          {o.source === "task" ? (
                            <span style={{ marginInlineStart: "6px", fontSize: "10px" }}>
                              {o.targetKind === "absolute" ? (ar ? "هدف" : "target") : (ar ? "أقران" : "peer")}
                            </span>
                          ) : null}
                        </span>
                        <span style={{ flex: "1 1 140px", height: "5px", borderRadius: "4px", background: "#E2E8F0", overflow: "hidden" }}>
                          <span style={bar(o.attainmentPct, o.source === "task" ? ACCENT : "#94A3B8")} />
                        </span>
                        <span dir="ltr" style={{ flex: "0 0 76px", fontSize: "11px", color: MUTED, textAlign: "end", fontFamily: "'IBM Plex Sans',sans-serif" }}>
                          +{o.contribution}
                        </span>
                      </div>
                    ))}
                    {r.ratingJustification ? (
                      <div style={{ marginTop: "8px", fontSize: "11px", color: MUTED, lineHeight: 1.7 }}>
                        {ar ? "مبرر المعايرة: " : "Calibration justification: "}{r.ratingJustification}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReviewCyclePanel
        ar={ar}
        isSenior={isSenior}
        cycle={state.cycle}
        cycles={state.cycles || []}
        progress={state.progress}
        board={board}
        band={state.calibrationBand}
        busy={busy}
        onRun={run}
      />
    </section>
  );
}
