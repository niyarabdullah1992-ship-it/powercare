import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees } from "@/lib/permissions";
import { employeeJobGrade, gradesForTrack, jobGradeLabel } from "@/lib/jobGrades";
import { assignOrgSeat, countPositionAccess, positionsForTrack } from "@/lib/orgPositions";
import { POSITION_ACCESS, POSITION_ACCESS_LABEL } from "@/lib/orgPositions";
import { orgTrackById, trackLabel } from "@/lib/orgTracks";
import OrgTrackPills from "@/components/hr/OrgTrackPills";
import { toast } from "@/components/ui/use-toast";
import { MUTED, NAVY, cardShell, field, ui } from "@/lib/platformStyles";

const ACCESS_TONE = {
  own: { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" },
  station: { background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" },
  view: { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" },
  manage: { background: "#ECFDF3", color: "#166534", border: "1px solid #BBF7D0" },
};

function AccessChips({ permissions, ar }) {
  const counts = countPositionAccess(permissions);
  const bits = POSITION_ACCESS.filter((access) => access !== "hidden" && counts[access] > 0);
  if (!bits.length) return <span style={{ fontSize: 12, color: MUTED }}>{ar ? "هذا المنصب لا يفتح أقساماً." : "This seat opens no sections."}</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {bits.map((access) => {
        const lab = POSITION_ACCESS_LABEL[access];
        return (
          <span key={access} style={{ ...ACCESS_TONE[access], padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
            {ar ? lab.ar : lab.en} {counts[access]}
          </span>
        );
      })}
    </div>
  );
}

export default function OrgAssignBoard({ lang = "ar", trackId = "", onTrackId, initialEmployeeId = "" }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";
  const canWrite = Boolean(currentUser && (
    canManageEmployees(currentUser, data)
    || ownerMode
    || ["pgm", "admin", "hr_manager"].includes(currentUser.role)
  ));

  const seats = positionsForTrack(data, trackId);
  const listName = trackLabel(orgTrackById(data, trackId), ar);
  const employees = useMemo(
    () => [...(data?.employees || [])]
      .filter((employee) => employee.id !== data?.ownerId)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar")),
    [data],
  );

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [positionId, setPositionId] = useState("");
  const [gradeId, setGradeId] = useState("");

  const employee = employees.find((item) => item.id === employeeId);
  const position = seats.find((item) => item.id === positionId);
  const grades = gradesForTrack(data, position?.trackId || trackId);
  const currentGrade = employeeJobGrade(employee, data);
  const currentTitle = employee?.profile?.position || employee?.position || "";

  const fillEmployee = (id) => {
    setEmployeeId(id);
    const next = employees.find((item) => item.id === id);
    const title = next?.profile?.position || next?.position || "";
    const match = seats.find((item) => item.title === title);
    setPositionId(match?.id || "");
    const nextGrade = next?.profile?.gradeId || "";
    const nextGrades = gradesForTrack(data, match?.trackId || trackId);
    setGradeId(nextGrades.some((item) => item.id === nextGrade) ? nextGrade : "");
  };

  const choosePosition = (id) => {
    setPositionId(id);
    const next = seats.find((item) => item.id === id);
    const nextGrades = gradesForTrack(data, next?.trackId || trackId);
    setGradeId((prev) => (nextGrades.some((item) => item.id === prev) ? prev : ""));
  };

  useEffect(() => {
    if (initialEmployeeId) fillEmployee(initialEmployeeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmployeeId]);

  useEffect(() => {
    if (employeeId) fillEmployee(employeeId);
    else {
      setPositionId("");
      setGradeId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const assign = () => {
    if (!company?.id || !canWrite || !employeeId) return;
    if (positionId && !position) return;
    if (gradeId && !grades.some((item) => item.id === gradeId)) {
      toast({ description: ar ? "الدرجة يجب أن تكون من قائمة هذا المنصب." : "The grade must belong to this seat’s list.", variant: "destructive" });
      return;
    }
    const gradeInList = grades.some((item) => item.id === currentGrade?.id);
    const seatTrack = position?.trackId || grades.find((item) => item.id === gradeId)?.trackId || trackId;
    const result = assignOrgSeat(company.id, {
      employeeId,
      positionId,
      trackId: seatTrack,
      gradeId: gradeId !== ""
        ? gradeId
        : (positionId && currentGrade && !gradeInList ? "" : undefined),
    }, ownerMode);
    if (!result.ok) {
      toast({ description: ar ? "اختر موظفاً ثم منصباً أو درجة." : "Pick an employee, then a seat or grade.", variant: "destructive" });
      return;
    }
    refresh?.();
    toast({
      description: ar
        ? `عُيّن «${employee?.name || ""}»${result.title ? ` — ${result.title}` : ""}`
        : `Assigned «${employee?.name || ""}»${result.title ? ` — ${result.title}` : ""}`,
    });
  };

  const ready = Boolean(employeeId && (positionId || gradeId));

  return (
    <div style={cardShell}>
      <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>
        {ar ? (listName ? `تعيين — تصفية «${listName}»` : "تعيين موظف") : (listName ? `Assign — “${listName}” filter` : "Assign someone")}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
        {ar ? "موظف ثم منصب. الدرجة من قائمة ذلك المنصب. المنصب يحمل صلاحياته." : "Employee, then seat. The grade follows that seat’s list. The seat carries its access."}
      </p>
      <div style={{ marginTop: 14 }}>
        <OrgTrackPills data={data} value={trackId} onChange={onTrackId} ar={ar} includeAll />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 18 }}>
        <label>
          <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>{ar ? "الموظف" : "Employee"}</span>
          <select value={employeeId} onChange={(event) => fillEmployee(event.target.value)} disabled={!canWrite} style={field}>
            <option value="">{ar ? "اختر موظفاً" : "Choose an employee"}</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>{ar ? "المنصب" : "Position"}</span>
          <select value={positionId} onChange={(event) => choosePosition(event.target.value)} disabled={!canWrite} style={field}>
            <option value="">{seats.length ? (ar ? "أبقِ المنصب الحالي" : "Keep current seat") : (ar ? "لا مناصب" : "No seats")}</option>
            {seats.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
                {trackLabel(orgTrackById(data, item.trackId), ar) ? ` · ${trackLabel(orgTrackById(data, item.trackId), ar)}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>{ar ? "الدرجة" : "Grade"}</span>
          <select value={gradeId} onChange={(event) => setGradeId(event.target.value)} disabled={!canWrite} style={field}>
            <option value="">{grades.length ? (ar ? "أبقِ الدرجة الحالية" : "Keep current grade") : (ar ? "لا درجات لهذه القائمة" : "No grades for this list")}</option>
            {grades.map((item) => (
              <option key={item.id} value={item.id}>{jobGradeLabel(item)}</option>
            ))}
          </select>
        </label>
      </div>

      {employee ? (
        <div style={{ marginTop: 14, fontSize: 12, color: MUTED }}>
          {ar ? "الآن" : "Now"}
          {": "}
          <strong style={{ color: NAVY, fontWeight: 600 }}>{currentTitle || (ar ? "بلا منصب" : "No seat")}</strong>
          {currentGrade ? ` · ${jobGradeLabel(currentGrade)}` : ""}
        </div>
      ) : null}

      {position ? (
        <div style={{ marginTop: 10 }}>
          <AccessChips permissions={position.permissions} ar={ar} />
        </div>
      ) : null}

      {canWrite ? (
        <button type="button" onClick={assign} disabled={!ready} style={{ ...ui.btnPrimary, marginTop: 18, height: 40, opacity: ready ? 1 : 0.45 }}>
          {ar ? "حفظ التعيين" : "Save assignment"}
        </button>
      ) : null}
    </div>
  );
}
