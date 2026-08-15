import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees } from "@/lib/permissions";
import { addJobGrade, deleteJobGrade, gradesForTrack, jobGradeLabel, moveJobGrade } from "@/lib/jobGrades";
import { orderedOrgTracks, trackLabel } from "@/lib/orgTracks";
import OrgTrackPills from "@/components/hr/OrgTrackPills";
import { toast } from "@/components/ui/use-toast";
import { MUTED, NAVY, SURFACE, cardShell, field, tableShell, ui } from "@/lib/platformStyles";

export default function OrgGradeBoard({ lang = "ar", lockedTrackId }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";
  const canWrite = Boolean(currentUser && (
    canManageEmployees(currentUser, data)
    || ownerMode
    || ["pgm", "admin", "hr_manager"].includes(currentUser.role)
  ));
  const tracks = orderedOrgTracks(data);
  const [trackId, setTrackId] = useState(lockedTrackId || tracks[0]?.id || "");
  useEffect(() => {
    if (lockedTrackId) setTrackId(lockedTrackId);
  }, [lockedTrackId]);
  const [gradeNumber, setGradeNumber] = useState("");
  const [title, setTitle] = useState("");
  const grades = gradesForTrack(data, trackId);
  const track = tracks.find((item) => item.id === trackId);

  const add = () => {
    if (!company?.id || !canWrite) return;
    const created = addJobGrade(company.id, gradeNumber, title, trackId);
    if (!created) {
      toast({ description: ar ? "اختر قائمة ثم أدخل رقم الدرجة ومسماها." : "Pick a list, then enter the grade number and title.", variant: "destructive" });
      return;
    }
    setGradeNumber("");
    setTitle("");
    refresh?.();
    toast({ description: ar ? "أُنشئت الدرجة." : "Grade created." });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardShell}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "درجات القائمة" : "Grades for this list"}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7, maxWidth: 760 }}>
          {ar
            ? "سلّم الترقية لهذه القائمة فقط — لا يُخلط مع قائمة أخرى."
            : "Promotion ladder for this list only — not mixed with another list."}
        </p>
        {lockedTrackId ? null : (
          <div style={{ marginTop: 14 }}>
            <OrgTrackPills data={data} value={trackId} onChange={setTrackId} ar={ar} includeAll={false} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,0.7fr) minmax(180px,1.4fr) auto", gap: 10, marginTop: 16, alignItems: "end" }}>
          <label>
            <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>{ar ? "الرقم" : "Number"}</span>
            <input
              value={gradeNumber}
              onChange={(event) => setGradeNumber(event.target.value)}
              disabled={!canWrite || !trackId}
              placeholder={ar ? "L2" : "L2"}
              style={field}
            />
          </label>
          <label>
            <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>{ar ? "مسمى الدرجة" : "Grade title"}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canWrite || !trackId}
              placeholder={ar ? "مدير أول" : "Senior manager"}
              style={field}
            />
          </label>
          {canWrite ? (
            <button type="button" onClick={add} style={ui.btnPrimary}>
              {ar ? "أنشئ الدرجة" : "Create grade"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={tableShell}>
        <div style={{ padding: "16px 18px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
            {track ? (ar ? `سلّم «${trackLabel(track, ar)}»` : `“${trackLabel(track, ar)}” ladder`) : (ar ? "جدول الدرجات" : "Grades table")}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: MUTED }}>
            {ar ? "رتّب السلّم ثم اختر الدرجة عند التعيين من الشجرة." : "Order the ladder, then pick a grade when appointing from the tree."}
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 480 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(220px,1fr) 120px",
              gap: 10,
              padding: "10px 18px",
              background: SURFACE,
              borderTop: "1px solid #E2E8F0",
              borderBottom: "1px solid #E2E8F0",
              fontSize: 10,
              letterSpacing: "0.04em",
              color: MUTED,
              fontWeight: 600,
            }}
            >
              <div>#</div>
              <div>{ar ? "الدرجة" : "Grade"}</div>
              <div />
            </div>
            {grades.length === 0 ? (
              <div style={{ padding: "22px 18px", fontSize: 12, color: MUTED, textAlign: "center" }}>
                {ar ? "لا درجات في هذه القائمة بعد." : "No grades in this list yet."}
              </div>
            ) : grades.map((grade, index) => (
              <div
                key={grade.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px minmax(220px,1fr) 120px",
                  gap: 10,
                  padding: "12px 18px",
                  borderBottom: "1px solid #F1F5F9",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: MUTED }}>{index + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{jobGradeLabel(grade)}</div>
                {canWrite ? (
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button type="button" aria-label={ar ? "أعلى" : "Up"} onClick={() => { moveJobGrade(company.id, grade.id, -1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronUp style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" aria-label={ar ? "أسفل" : "Down"} onClick={() => { moveJobGrade(company.id, grade.id, 1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronDown style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      type="button"
                      aria-label={ar ? "حذف" : "Delete"}
                      onClick={() => {
                        if (!window.confirm(ar ? `حذف درجة «${jobGradeLabel(grade)}»؟` : `Delete “${jobGradeLabel(grade)}”?`)) return;
                        deleteJobGrade(company.id, grade.id);
                        refresh?.();
                      }}
                      style={ui.btnDanger}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
