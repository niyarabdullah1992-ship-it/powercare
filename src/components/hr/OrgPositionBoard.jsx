import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { GRANTABLE_DEPARTMENTS, SMART_SECTION_GROUPS } from "@/lib/smartPositions";
import { OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";
import { canManageEmployees } from "@/lib/permissions";
import {
  POSITION_ACCESS,
  POSITION_ACCESS_LABEL,
  countPositionAccess,
  deleteOrgPosition,
  moveOrgPosition,
  orderedOrgPositions,
  positionsForTrack,
  saveOrgPosition,
} from "@/lib/orgPositions";
import { orderedOrgTracks, orgTrackById, trackLabel } from "@/lib/orgTracks";
import OrgTrackPills from "@/components/hr/OrgTrackPills";
import { toast } from "@/components/ui/use-toast";
import { BORDER, CARD, MUTED, NAVY, NAVY_FILL, SURFACE, cardShell, field, tableShell, ui } from "@/lib/platformStyles";

const ACCESS_TONE = {
  hidden: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" },
  own: { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" },
  station: { background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" },
  view: { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" },
  manage: { background: "#ECFDF3", color: "#166534", border: "1px solid #BBF7D0" },
};

function accessChip(access, ar) {
  const lab = POSITION_ACCESS_LABEL[access] || POSITION_ACCESS_LABEL.hidden;
  return { ...ACCESS_TONE[access] || ACCESS_TONE.hidden, text: ar ? lab.ar : lab.en };
}

function AccessSegment({ value, onChange, disabled = false, blocked = [], ar }) {
  return (
    <div
      role="radiogroup"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        overflow: "hidden",
        background: SURFACE,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {POSITION_ACCESS.map((option, index) => {
        const lab = POSITION_ACCESS_LABEL[option];
        const on = value === option;
        const locked = blocked.includes(option);
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled || locked}
            onClick={() => onChange(option)}
            title={ar ? lab.fullAr : lab.fullEn}
            style={{
              height: 34,
              border: "none",
              borderInlineStart: index ? `1px solid ${BORDER}` : "none",
              background: on ? NAVY_FILL : "transparent",
              color: on ? "#fff" : locked ? "#CBD5E1" : MUTED,
              fontSize: 11,
              fontWeight: on ? 600 : 500,
              fontFamily: "inherit",
              cursor: disabled || locked ? "not-allowed" : "pointer",
              padding: "0 4px",
              whiteSpace: "nowrap",
            }}
          >
            {ar ? lab.ar : lab.en}
          </button>
        );
      })}
    </div>
  );
}

function AccessCounts({ permissions, ar }) {
  const counts = countPositionAccess(permissions);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {POSITION_ACCESS.filter((access) => access !== "hidden" && counts[access] > 0).map((access) => {
        const chip = accessChip(access, ar);
        return (
          <span
            key={access}
            style={{
              ...chip,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {chip.text}
            <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 500 }}>{counts[access]}</span>
          </span>
        );
      })}
      {POSITION_ACCESS.filter((access) => access !== "hidden").every((access) => !counts[access]) ? (
        <span style={{ fontSize: 11, color: MUTED }}>{ar ? "لا يرى أي قسم" : "No sections visible"}</span>
      ) : null}
    </div>
  );
}

export default function OrgPositionBoard({ lang = "ar", lockedTrackId }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";
  const canWrite = Boolean(currentUser && (
    canManageEmployees(currentUser, data)
    || ownerMode
    || ["pgm", "admin", "hr_manager"].includes(currentUser.role)
  ));

  const tracks = orderedOrgTracks(data);
  const [filterTrackId, setFilterTrackId] = useState(lockedTrackId || "");
  const [trackId, setTrackId] = useState(lockedTrackId || tracks[0]?.id || "");
  useEffect(() => {
    if (!lockedTrackId) return;
    setFilterTrackId(lockedTrackId);
    setTrackId(lockedTrackId);
  }, [lockedTrackId]);
  const positions = filterTrackId ? positionsForTrack(data, filterTrackId) : orderedOrgPositions(data);

  const [title, setTitle] = useState("");
  const [permissions, setPermissions] = useState({});
  const [editingId, setEditingId] = useState("");

  const setAccess = (departmentId, access) => {
    setPermissions((prev) => {
      const next = { ...prev };
      if (!access || access === "hidden") delete next[departmentId];
      else next[departmentId] = access;
      return next;
    });
  };

  const setAllAccess = (access) => {
    setPermissions(() => {
      const next = {};
      GRANTABLE_DEPARTMENTS.forEach((department) => {
        const locked = !ownerMode && OWNER_ONLY_DEPARTMENTS.includes(department.id);
        const value = locked && access === "manage" ? "view" : access;
        if (value && value !== "hidden") next[department.id] = value;
      });
      return next;
    });
  };

  const allValue = (() => {
    const values = GRANTABLE_DEPARTMENTS.map((department) => permissions[department.id] || "hidden");
    const first = values[0];
    return values.every((value) => value === first) ? first : "";
  })();

  const resetForm = () => {
    setTitle("");
    setPermissions({});
    setEditingId("");
    setTrackId(filterTrackId || tracks[0]?.id || "");
  };

  const savePosition = () => {
    if (!company?.id || !canWrite) return;
    const id = saveOrgPosition(company.id, { id: editingId, title, permissions, trackId }, ownerMode);
    if (!id) {
      toast({ description: ar ? "اسم المنصب والقائمة مطلوبان." : "A position name and list are required.", variant: "destructive" });
      return;
    }
    refresh?.();
    toast({ description: ar ? "حُفظ المنصب." : "Position saved." });
    resetForm();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardShell}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {editingId ? (ar ? `تعديل «${title || "المنصب"}»` : `Edit “${title || "position"}”`) : (ar ? "منصب جديد" : "New position")}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7, maxWidth: 720 }}>
          {ar
            ? "المنصب يحدد ماذا يرى الموظف في الأقسام. الدرجة من سلّم هذه القائمة."
            : "The seat decides what the employee sees. The grade comes from this list’s ladder."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: lockedTrackId ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16, maxWidth: lockedTrackId ? 420 : 640 }}>
          {lockedTrackId ? null : (
          <label>
            <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>
              {ar ? "القائمة" : "List"}
            </span>
            <select value={trackId} onChange={(event) => setTrackId(event.target.value)} disabled={!canWrite} style={field}>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>{trackLabel(track, ar)}</option>
              ))}
            </select>
          </label>
          )}
          <label>
            <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>
              {ar ? "اسم المنصب" : "Position name"}
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canWrite}
              placeholder={ar ? "مثال: مدير عمليات" : "e.g. Operations manager"}
              style={field}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 12,
            border: `1px solid ${BORDER}`,
            background: SURFACE,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,0.9fr) minmax(280px,1.4fr)", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{ar ? "تطبيق على الكل" : "Apply to all"}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                {ar ? "ثم عدّل قسماً إن لزم" : "Then adjust a section if needed"}
              </div>
            </div>
            <AccessSegment value={allValue} onChange={setAllAccess} disabled={!canWrite} ar={ar} />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {POSITION_ACCESS.map((option) => {
            const lab = POSITION_ACCESS_LABEL[option];
            return (
              <span key={option} style={{ fontSize: 10, color: MUTED }}>
                <strong style={{ color: NAVY, fontWeight: 600 }}>{ar ? lab.ar : lab.en}</strong>
                {" — "}
                {ar ? lab.fullAr : lab.fullEn}
              </span>
            );
          })}
        </div>

        {SMART_SECTION_GROUPS.map((group) => {
          const items = GRANTABLE_DEPARTMENTS.filter((department) => department.group === group.id);
          if (!items.length) return null;
          return (
            <section key={group.id} style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.04em", marginBottom: 8 }}>
                {ar ? group.ar : group.en}
              </div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", background: CARD }}>
                {items.map((department, index) => {
                  const locked = !ownerMode && OWNER_ONLY_DEPARTMENTS.includes(department.id);
                  const value = permissions[department.id] || "hidden";
                  return (
                    <div
                      key={department.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(140px,0.9fr) minmax(280px,1.4fr)",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 14px",
                        borderTop: index ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>
                          {ar ? department.ar : department.en}
                        </div>
                        {locked ? (
                          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
                            {ar ? "التحكم الكامل للمالك فقط" : "Full control is owner-only"}
                          </div>
                        ) : null}
                      </div>
                      <AccessSegment
                        value={value}
                        onChange={(access) => setAccess(department.id, access)}
                        disabled={!canWrite}
                        blocked={locked ? ["manage"] : []}
                        ar={ar}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {canWrite ? (
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <button type="button" onClick={savePosition} style={ui.btnPrimary}>
              {editingId ? (ar ? "حدّث المنصب" : "Update position") : (ar ? "احفظ المنصب" : "Save position")}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} style={ui.btnGhost}>
                {ar ? "منصب جديد" : "New position"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={tableShell}>
        <div style={{ padding: "16px 18px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{ar ? "جدول المناصب" : "Positions table"}</div>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: MUTED }}>
            {ar ? "احفظ المنصب هنا، ثم عيّنه للموظف من تبويب التعيين." : "Save the seat here, then assign it from the Assign tab."}
          </p>
          {lockedTrackId ? null : (
          <div style={{ marginTop: 12 }}>
            <OrgTrackPills
              data={data}
              value={filterTrackId}
              onChange={(id) => {
                setFilterTrackId(id);
                if (!editingId && id) setTrackId(id);
              }}
              ar={ar}
            />
          </div>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(120px,0.9fr) minmax(90px,0.6fr) minmax(200px,1.6fr) 120px",
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
              <div>{ar ? "المنصب" : "Position"}</div>
              <div>{ar ? "القائمة" : "List"}</div>
              <div>{ar ? "الصلاحيات" : "Access"}</div>
              <div />
            </div>
            {positions.length === 0 ? (
              <div style={{ padding: "22px 18px", fontSize: 12, color: MUTED, textAlign: "center" }}>
                {ar ? "لا مناصب بعد — أنشئ منصباً من الصندوق أعلاه." : "No positions yet — create one in the box above."}
              </div>
            ) : positions.map((position, index) => (
              <div
                key={position.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px minmax(120px,0.9fr) minmax(90px,0.6fr) minmax(200px,1.6fr) 120px",
                  gap: 10,
                  padding: "12px 18px",
                  borderBottom: "1px solid #F1F5F9",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: MUTED }}>{index + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{position.title}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{trackLabel(orgTrackById(data, position.trackId), ar) || (ar ? "—" : "—")}</div>
                <AccessCounts permissions={position.permissions} ar={ar} />
                {canWrite ? (
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button type="button" aria-label={ar ? "أعلى" : "Up"} onClick={() => { moveOrgPosition(company.id, position.id, -1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronUp style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" aria-label={ar ? "أسفل" : "Down"} onClick={() => { moveOrgPosition(company.id, position.id, 1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronDown style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      type="button"
                      aria-label={ar ? "تعديل" : "Edit"}
                      onClick={() => {
                        setEditingId(position.id);
                        setTitle(position.title);
                        setTrackId(position.trackId || tracks[0]?.id || "");
                        setPermissions({ ...(position.permissions || {}) });
                      }}
                      style={ui.btnGhost}
                    >
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button
                      type="button"
                      aria-label={ar ? "حذف" : "Delete"}
                      onClick={() => {
                        if (!window.confirm(ar ? `حذف منصب «${position.title}»؟` : `Delete “${position.title}”?`)) return;
                        deleteOrgPosition(company.id, position.id);
                        if (editingId === position.id) resetForm();
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
