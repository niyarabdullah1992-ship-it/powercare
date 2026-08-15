import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees } from "@/lib/permissions";
import { addJobGrade, deleteJobGrade, gradesForTrack, jobGradeLabel, moveJobGrade, saveJobGrade } from "@/lib/jobGrades";
import {
  POSITION_ACCESS,
  POSITION_ACCESS_LABEL,
  countPositionAccess,
  deleteOrgPosition,
  moveOrgPosition,
  positionsForTrack,
  saveOrgPosition,
} from "@/lib/orgPositions";
import { GRANTABLE_DEPARTMENTS, SMART_SECTION_GROUPS } from "@/lib/smartPositions";
import { BUILT_IN_TEMPLATES, OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";
import { deleteOrgTrack, orderedOrgTracks, orgTrackById, orgTrackUsage, saveOrgTrack, trackLabel } from "@/lib/orgTracks";
import OrgTrackPills from "@/components/hr/OrgTrackPills";
import { toast } from "@/components/ui/use-toast";
import { BORDER, CARD, MUTED, NAVY, NAVY_FILL, SURFACE, cardShell, field, ui } from "@/lib/platformStyles";

const ACCESS_TONE = {
  own: { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" },
  station: { background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" },
  view: { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" },
  manage: { background: "#ECFDF3", color: "#166534", border: "1px solid #BBF7D0" },
};

function AccessChips({ permissions, ar }) {
  const counts = countPositionAccess(permissions);
  const bits = POSITION_ACCESS.filter((access) => access !== "hidden" && counts[access] > 0);
  if (!bits.length) return <span style={{ fontSize: 11, color: MUTED }}>{ar ? "بلا أقسام" : "No sections"}</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {bits.map((access) => {
        const lab = POSITION_ACCESS_LABEL[access];
        return (
          <span key={access} style={{ ...ACCESS_TONE[access], padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 600 }}>
            {ar ? lab.ar : lab.en} {counts[access]}
          </span>
        );
      })}
    </div>
  );
}

function AccessSegment({ value, onChange, disabled = false, blocked = [], ar }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", background: SURFACE, opacity: disabled ? 0.55 : 1 }}>
      {POSITION_ACCESS.map((option, index) => {
        const lab = POSITION_ACCESS_LABEL[option];
        const on = value === option;
        const locked = blocked.includes(option);
        return (
          <button
            key={option}
            type="button"
            disabled={disabled || locked}
            onClick={() => onChange(option)}
            style={{
              height: 32,
              border: "none",
              borderInlineStart: index ? `1px solid ${BORDER}` : "none",
              background: on ? NAVY_FILL : "transparent",
              color: on ? "#fff" : locked ? "#CBD5E1" : MUTED,
              fontSize: 11,
              fontWeight: on ? 600 : 500,
              fontFamily: "inherit",
              cursor: disabled || locked ? "not-allowed" : "pointer",
            }}
          >
            {ar ? lab.ar : lab.en}
          </button>
        );
      })}
    </div>
  );
}

export default function OrgListPanel({ lang = "ar", trackId, onTrackId, onAssign }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";
  const canWrite = Boolean(currentUser && (
    canManageEmployees(currentUser, data)
    || ownerMode
    || ["pgm", "admin", "hr_manager"].includes(currentUser.role)
  ));

  const tracks = orderedOrgTracks(data);
  const visible = trackId ? tracks.filter((track) => track.id === trackId) : tracks;
  const allSeats = positionsForTrack(data, "");

  const [seatDrafts, setSeatDrafts] = useState({});
  const [gradeNums, setGradeNums] = useState({});
  const [gradeNames, setGradeNames] = useState({});
  const [editingId, setEditingId] = useState("");
  const [permissions, setPermissions] = useState({});
  const [draftTitles, setDraftTitles] = useState({});
  const [draftListNames, setDraftListNames] = useState({});
  const [draftGradeNums, setDraftGradeNums] = useState({});
  const [draftGradeNames, setDraftGradeNames] = useState({});
  const [newListTitle, setNewListTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState("");

  const createList = (title) => {
    if (!company?.id || !canWrite) return "";
    const id = saveOrgTrack(company.id, { title });
    if (!id) {
      toast({ description: ar ? "اسم القائمة مطلوب." : "A list name is required.", variant: "destructive" });
      return "";
    }
    refresh?.();
    return id;
  };

  const addSeat = (listId) => {
    if (!company?.id || !canWrite || !listId) return;
    const id = saveOrgPosition(company.id, {
      title: seatDrafts[listId] || "",
      permissions: BUILT_IN_TEMPLATES[0]?.permissions || {},
      trackId: listId,
    }, ownerMode);
    if (!id) {
      toast({ description: ar ? "اسم المنصب مطلوب." : "A position name is required.", variant: "destructive" });
      return;
    }
    setSeatDrafts((prev) => ({ ...prev, [listId]: "" }));
    setEditingId(id);
    setPermissions({ ...(BUILT_IN_TEMPLATES[0]?.permissions || {}) });
    refresh?.();
  };

  const addGrade = (listId) => {
    if (!company?.id || !canWrite || !listId) return;
    const created = addJobGrade(company.id, gradeNums[listId], gradeNames[listId], listId);
    if (!created) {
      toast({ description: ar ? "أدخل رقم الدرجة ومسماها." : "Enter the grade number and title.", variant: "destructive" });
      return;
    }
    setGradeNums((prev) => ({ ...prev, [listId]: "" }));
    setGradeNames((prev) => ({ ...prev, [listId]: "" }));
    refresh?.();
  };

  const closePerms = () => {
    setEditingId("");
    setPermissions({});
  };

  const openPerms = (position) => {
    if (editingId === position.id) {
      closePerms();
      return;
    }
    setEditingId(position.id);
    setPermissions({ ...(position.permissions || {}) });
  };

  const savePerms = () => {
    const position = allSeats.find((item) => item.id === editingId);
    if (!company?.id || !position) return;
    saveOrgPosition(company.id, {
      id: position.id,
      title: position.title,
      permissions,
      trackId: position.trackId,
    }, ownerMode);
    closePerms();
    refresh?.();
    toast({ description: ar ? "حُفظت الأقسام." : "Sections saved." });
  };

  const commitSeat = (position, patch = {}) => {
    if (!company?.id || !canWrite) return;
    const title = String(patch.title ?? draftTitles[position.id] ?? position.title).trim();
    const nextTrack = patch.trackId || position.trackId;
    if (!title) {
      toast({ description: ar ? "اسم المنصب مطلوب." : "A position name is required.", variant: "destructive" });
      setDraftTitles((prev) => ({ ...prev, [position.id]: position.title }));
      return;
    }
    if (title === position.title && nextTrack === position.trackId) return;
    const id = saveOrgPosition(company.id, {
      id: position.id,
      title,
      permissions: position.permissions || {},
      trackId: nextTrack,
    }, ownerMode);
    if (!id) {
      toast({ description: ar ? "تعذّر حفظ المنصب." : "Could not save the position.", variant: "destructive" });
      return;
    }
    setDraftTitles((prev) => {
      const next = { ...prev };
      delete next[position.id];
      return next;
    });
    refresh?.();
    toast({ description: ar ? "حُفظ المنصب." : "Position saved." });
  };

  const commitGrade = (grade) => {
    if (!company?.id || !canWrite) return;
    const number = String(draftGradeNums[grade.id] ?? grade.gradeNumber ?? "").trim();
    const name = String(draftGradeNames[grade.id] ?? grade.title ?? grade.name ?? "").trim();
    if (!number || !name) {
      toast({ description: ar ? "رقم الدرجة ومسماها مطلوبان." : "Grade number and title are required.", variant: "destructive" });
      setDraftGradeNums((prev) => ({ ...prev, [grade.id]: grade.gradeNumber || "" }));
      setDraftGradeNames((prev) => ({ ...prev, [grade.id]: grade.title || grade.name || "" }));
      return;
    }
    if (number === String(grade.gradeNumber || "") && name === (grade.title || grade.name || "")) return;
    if (!saveJobGrade(company.id, { id: grade.id, gradeNumber: number, title: name, trackId: grade.trackId })) {
      toast({ description: ar ? "تعذّر حفظ الدرجة." : "Could not save the grade.", variant: "destructive" });
      return;
    }
    setDraftGradeNums((prev) => {
      const next = { ...prev };
      delete next[grade.id];
      return next;
    });
    setDraftGradeNames((prev) => {
      const next = { ...prev };
      delete next[grade.id];
      return next;
    });
    refresh?.();
    toast({ description: ar ? "حُفظت الدرجة." : "Grade saved." });
  };

  const addList = () => {
    const id = createList(newListTitle);
    if (!id) return;
    setNewListTitle("");
    onTrackId?.("");
    toast({ description: ar ? "أُضيفت القائمة." : "List added." });
  };

  const renameList = (listId) => {
    if (!company?.id || !canWrite || !listId) return;
    const current = trackLabel(orgTrackById(data, listId), ar);
    const next = String(draftListNames[listId] ?? current).trim();
    if (!next) {
      toast({ description: ar ? "اسم القائمة مطلوب." : "A list name is required.", variant: "destructive" });
      setDraftListNames((prev) => ({ ...prev, [listId]: current }));
      return;
    }
    if (next === current) return;
    if (!saveOrgTrack(company.id, { id: listId, title: next })) {
      toast({ description: ar ? "اسم القائمة مطلوب." : "A list name is required.", variant: "destructive" });
      return;
    }
    setDraftListNames((prev) => {
      const names = { ...prev };
      delete names[listId];
      return names;
    });
    refresh?.();
    toast({ description: ar ? "حُفظ اسم القائمة." : "List name saved." });
  };

  const removeList = (listId) => {
    if (!company?.id || !canWrite || !listId) return;
    if (tracks.length <= 1) {
      toast({ description: ar ? "يجب أن تبقى قائمة واحدة." : "At least one list must remain.", variant: "destructive" });
      return;
    }
    const name = trackLabel(orgTrackById(data, listId), ar);
    const result = deleteOrgTrack(company.id, listId, { cascade: true });
    if (!result.ok) {
      toast({
        description: result.last
          ? (ar ? "يجب أن تبقى قائمة واحدة." : "At least one list must remain.")
          : (ar ? "تعذّر حذف القائمة." : "Could not delete the list."),
        variant: "destructive",
      });
      return;
    }
    if (trackId === listId) onTrackId?.("");
    setPendingDelete("");
    refresh?.();
    toast({ description: ar ? `حُذفت قائمة «${name}».` : `Deleted “${name}”.` });
  };

  const setAccess = (departmentId, access) => {
    setPermissions((prev) => {
      const next = { ...prev };
      if (!access || access === "hidden") delete next[departmentId];
      else next[departmentId] = access;
      return next;
    });
  };

  const deleteCopy = (listId) => {
    const name = trackLabel(orgTrackById(data, listId), ar);
    const usage = orgTrackUsage(data, listId);
    const lastList = tracks.length <= 1;
    return {
      title: ar ? `حذف قائمة «${name}»` : `Delete “${name}”`,
      description: lastList
        ? (ar ? "يجب أن تبقى قائمة واحدة على الأقل. أضف قائمة أخرى قبل الحذف." : "At least one list must remain. Add another list first.")
        : ar
          ? [
            usage.seats || usage.grades
              ? `سيتم حذف القائمة مع ${usage.seats} منصب و${usage.grades} درجة.`
              : "سيتم حذف هذه القائمة.",
            usage.assigned ? `هناك ${usage.assigned} موظفاً على هذه القائمة؛ تبقى أسماؤهم الحالية.` : "",
            "هذا الإجراء لا يُلغى.",
          ].filter(Boolean).join(" ")
          : [
            usage.seats || usage.grades
              ? `This removes the list with ${usage.seats} seats and ${usage.grades} grades.`
              : "This list will be removed.",
            usage.assigned ? `${usage.assigned} people keep their current titles.` : "",
            "This cannot be undone.",
          ].filter(Boolean).join(" "),
    };
  };

  const deleteConfirm = (listId) => {
    const warning = deleteCopy(listId);
    return (
      <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>{warning.title}</div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#7F1D1D", lineHeight: 1.7 }}>{warning.description}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => removeList(listId)} style={{ ...ui.btnDanger, background: "#DC2626", color: "#fff", borderColor: "#DC2626" }}>
            {ar ? "تأكيد الحذف" : "Confirm delete"}
          </button>
          <button type="button" onClick={() => setPendingDelete("")} style={ui.btnGhost}>{ar ? "إلغاء" : "Cancel"}</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardShell}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{ar ? "القوائم" : "Lists"}</div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED }}>
              {ar ? "كل قائمة تضم درجاتها ومناصبها. عيّن أقسام المنصب من الصف." : "Each list holds its grades and seats. Assign the seat’s sections from the row."}
            </p>
          </div>
          {onAssign ? (
            <button type="button" onClick={() => onAssign(trackId)} style={ui.btnPrimary}>{ar ? "تعيين موظف" : "Assign someone"}</button>
          ) : null}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <OrgTrackPills data={data} value={trackId} onChange={onTrackId} ar={ar} includeAll />
          {canWrite ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={newListTitle}
                onChange={(event) => setNewListTitle(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") addList(); }}
                placeholder={ar ? "قائمة جديدة" : "New list"}
                style={{ ...field, width: 140 }}
              />
              <button type="button" onClick={addList} style={ui.btnGhost}>{ar ? "أضف قائمة" : "Add list"}</button>
              <button
                type="button"
                onClick={() => {
                  if (!trackId) {
                    toast({ description: ar ? "اختر قائمة أولاً ثم احذفها." : "Pick a list first, then delete it.", variant: "destructive" });
                    return;
                  }
                  setPendingDelete(trackId);
                }}
                style={ui.btnDanger}
              >
                {ar ? "حذف القائمة" : "Delete list"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {visible.map((track) => {
        const seats = positionsForTrack(data, track.id);
        const grades = gradesForTrack(data, track.id);
        const name = trackLabel(track, ar);
        return (
          <section key={track.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
              <div>
                <input
                  value={draftListNames[track.id] ?? name}
                  onChange={(event) => setDraftListNames((prev) => ({ ...prev, [track.id]: event.target.value }))}
                  onBlur={() => renameList(track.id)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  disabled={!canWrite}
                  aria-label={ar ? "مسمى القائمة" : "List name"}
                  style={{ ...field, fontWeight: 600, fontSize: 15, maxWidth: 280 }}
                />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                  {ar ? `${seats.length} منصب · ${grades.length} درجة` : `${seats.length} seats · ${grades.length} grades`}
                </div>
              </div>
              {canWrite ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setPendingDelete(track.id)} style={ui.btnDanger}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                      {ar ? "حذف القائمة" : "Delete list"}
                    </span>
                  </button>
                  {onAssign ? (
                    <button type="button" onClick={() => onAssign(track.id)} style={ui.btnGhost}>{ar ? "عيّن" : "Assign"}</button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {pendingDelete === track.id ? deleteConfirm(track.id) : null}

            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 6 }}>{ar ? "الدرجات" : "Grades"}</div>
            {grades.length === 0 ? (
              <div style={{ fontSize: 12, color: MUTED, padding: "4px 0 8px" }}>{ar ? "لا درجات بعد." : "No grades yet."}</div>
            ) : grades.map((grade, index) => (
              <div key={grade.id} style={{ display: "grid", gridTemplateColumns: "18px 72px minmax(140px, 1fr) auto", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: MUTED }}>{index + 1}</span>
                <input
                  value={draftGradeNums[grade.id] ?? grade.gradeNumber ?? ""}
                  onChange={(event) => setDraftGradeNums((prev) => ({ ...prev, [grade.id]: event.target.value }))}
                  onBlur={() => commitGrade(grade)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  disabled={!canWrite}
                  aria-label={ar ? "رقم الدرجة" : "Grade number"}
                  style={{ ...field, fontWeight: 600 }}
                />
                <input
                  value={draftGradeNames[grade.id] ?? grade.title ?? grade.name ?? ""}
                  onChange={(event) => setDraftGradeNames((prev) => ({ ...prev, [grade.id]: event.target.value }))}
                  onBlur={() => commitGrade(grade)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  disabled={!canWrite}
                  aria-label={ar ? "مسمى الدرجة" : "Grade title"}
                  style={{ ...field, fontWeight: 600 }}
                />
                {canWrite ? (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button type="button" aria-label={ar ? "أعلى" : "Up"} onClick={() => { moveJobGrade(company.id, grade.id, -1); refresh?.(); }} style={ui.btnGhost}><ChevronUp style={{ width: 14, height: 14 }} /></button>
                    <button type="button" aria-label={ar ? "أسفل" : "Down"} onClick={() => { moveJobGrade(company.id, grade.id, 1); refresh?.(); }} style={ui.btnGhost}><ChevronDown style={{ width: 14, height: 14 }} /></button>
                    <button type="button" aria-label={ar ? "حذف" : "Delete"} onClick={() => { if (window.confirm(ar ? `حذف «${jobGradeLabel(grade)}»؟` : `Delete “${jobGradeLabel(grade)}”?`)) { deleteJobGrade(company.id, grade.id); refresh?.(); } }} style={ui.btnDanger}><Trash2 style={{ width: 13, height: 13 }} /></button>
                  </div>
                ) : <span />}
              </div>
            ))}
            {canWrite ? (
              <div style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 8, margin: "10px 0 16px" }}>
                <input value={gradeNums[track.id] || ""} onChange={(event) => setGradeNums((prev) => ({ ...prev, [track.id]: event.target.value }))} placeholder={ar ? "رقم" : "No."} style={field} />
                <input value={gradeNames[track.id] || ""} onChange={(event) => setGradeNames((prev) => ({ ...prev, [track.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") addGrade(track.id); }} placeholder={ar ? "مسمى الدرجة" : "Grade title"} style={field} />
                <button type="button" onClick={() => addGrade(track.id)} style={ui.btnPrimary}>{ar ? "أضف" : "Add"}</button>
              </div>
            ) : null}

            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 6 }}>{ar ? "المناصب" : "Seats"}</div>
            {seats.length === 0 ? (
              <div style={{ fontSize: 12, color: MUTED, padding: "4px 0 8px" }}>{ar ? "لا مناصب بعد." : "No seats yet."}</div>
            ) : seats.map((position, index) => (
              <div key={position.id} style={{ padding: "6px 0", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "18px minmax(160px, 1.1fr) minmax(110px, 0.7fr) auto", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{index + 1}</span>
                  <input
                    value={draftTitles[position.id] ?? position.title}
                    onChange={(event) => setDraftTitles((prev) => ({ ...prev, [position.id]: event.target.value }))}
                    onBlur={() => commitSeat(position)}
                    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                    disabled={!canWrite}
                    aria-label={ar ? "مسمى المنصب" : "Position title"}
                    style={{ ...field, fontWeight: 600 }}
                  />
                  <button type="button" onClick={() => openPerms(position)} style={{ border: "none", background: "transparent", padding: 0, textAlign: "start", cursor: "pointer" }}>
                    <AccessChips permissions={position.permissions} ar={ar} />
                  </button>
                  {canWrite ? (
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => openPerms(position)} style={ui.btnGhost}>
                        {editingId === position.id ? (ar ? "تصغير" : "Collapse") : (ar ? "تعيين الأقسام" : "Assign sections")}
                      </button>
                      {editingId === position.id ? (
                        <button type="button" aria-label={ar ? "تصغير" : "Collapse"} onClick={closePerms} style={ui.btnGhost}>
                          <ChevronUp style={{ width: 14, height: 14 }} />
                        </button>
                      ) : (
                        <>
                          <button type="button" aria-label={ar ? "أعلى" : "Up"} onClick={() => { moveOrgPosition(company.id, position.id, -1); refresh?.(); }} style={ui.btnGhost}><ChevronUp style={{ width: 14, height: 14 }} /></button>
                          <button type="button" aria-label={ar ? "أسفل" : "Down"} onClick={() => { moveOrgPosition(company.id, position.id, 1); refresh?.(); }} style={ui.btnGhost}><ChevronDown style={{ width: 14, height: 14 }} /></button>
                        </>
                      )}
                      <button type="button" aria-label={ar ? "حذف" : "Delete"} onClick={() => { if (window.confirm(ar ? `حذف «${position.title}»؟` : `Delete “${position.title}”?`)) { deleteOrgPosition(company.id, position.id); if (editingId === position.id) setEditingId(""); refresh?.(); } }} style={ui.btnDanger}><Trash2 style={{ width: 13, height: 13 }} /></button>
                    </div>
                  ) : <span />}
                </div>
                {editingId === position.id ? (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                      {ar ? `أقسام «${position.title}»` : `Sections for “${position.title}”`}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED }}>
                      {ar ? "حدد ماذا يرى هذا المنصب في كل قسم." : "Choose what this seat can see in each section."}
                    </p>
                    {SMART_SECTION_GROUPS.map((group) => {
                      const items = GRANTABLE_DEPARTMENTS.filter((department) => department.group === group.id);
                      if (!items.length) return null;
                      return (
                        <section key={group.id} style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 6 }}>{ar ? group.ar : group.en}</div>
                          {items.map((department) => {
                            const locked = !ownerMode && OWNER_ONLY_DEPARTMENTS.includes(department.id);
                            return (
                              <div key={department.id} style={{ display: "grid", gridTemplateColumns: "minmax(140px,0.8fr) minmax(240px,1.2fr)", gap: 10, alignItems: "center", padding: "6px 0" }}>
                                <div style={{ fontSize: 12, color: NAVY }}>{ar ? department.ar : department.en}</div>
                                <AccessSegment value={permissions[department.id] || "hidden"} onChange={(access) => setAccess(department.id, access)} disabled={!canWrite} blocked={locked ? ["manage"] : []} ar={ar} />
                              </div>
                            );
                          })}
                        </section>
                      );
                    })}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button type="button" onClick={savePerms} style={ui.btnPrimary}>{ar ? "حفظ الأقسام" : "Save sections"}</button>
                      <button type="button" onClick={closePerms} style={ui.btnGhost}>{ar ? "تصغير" : "Collapse"}</button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {canWrite ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 }}>
                <input value={seatDrafts[track.id] || ""} onChange={(event) => setSeatDrafts((prev) => ({ ...prev, [track.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") addSeat(track.id); }} placeholder={ar ? "اسم المنصب" : "Seat name"} style={field} />
                <button type="button" onClick={() => addSeat(track.id)} style={ui.btnPrimary}>{ar ? "أضف" : "Add"}</button>
              </div>
            ) : null}
          </section>
        );
      })}

    </div>
  );
}
