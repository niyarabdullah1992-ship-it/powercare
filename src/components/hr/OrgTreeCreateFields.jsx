import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";
import PermissionTemplatePicker from "@/components/hr/PermissionTemplatePicker";
import { grantedCount } from "@/lib/permissionTemplates";
import { orderedOrgPositions, summarizePositionAccess } from "@/lib/orgPositions";
import { orderedOrgTracks, trackLabel } from "@/lib/orgTracks";
import {
  ACCENT,
  CARD,
  MUTED,
  NAVY,
  SURFACE,
  hintText,
  inputField,
  labelText,
  segmentBtn,
  selectField,
} from "@/lib/orgModalStyles";

export default function OrgTreeCreateFields({
  type,
  setType,
  form,
  setForm,
  title,
  setTitle,
  permissions,
  setPermissions,
  stations,
  employees,
  ar,
  data,
  companyId,
  templateId,
  onTemplate,
  hasParent,
  customized,
  ownerMode,
  grantable,
  titleSuggestions = [],
  branchStationId,
  setBranchStationId,
  reportsToNodeId,
  setReportsToNodeId,
  positionId,
  setPositionId,
}) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const people = (data.orgTree || []).filter((n) => n.type === "employee");
  const granted = grantedCount(permissions);
  const positions = orderedOrgPositions(data);
  const tracks = orderedOrgTracks(data);

  const applyPosition = (id) => {
    setPositionId?.(id);
    if (!id) return;
    const position = positions.find((item) => item.id === id);
    if (!position) return;
    setTitle(position.title || "");
    setPermissions({ ...(position.permissions || {}) });
    onTemplate?.("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: 3, borderRadius: 10, background: "#EEF2F6" }}>
        <button type="button" onClick={() => setType("station")} style={segmentBtn(type === "station")}>
          {ar ? "فرع" : "Branch"}
        </button>
        <button type="button" onClick={() => setType("employee")} style={segmentBtn(type === "employee")}>
          {ar ? "موظف" : "Employee"}
        </button>
      </div>

      <input
        required
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder={type === "station" ? (ar ? "اسم الفرع" : "Branch name") : (ar ? "اسم الموظف" : "Employee name")}
        style={inputField}
      />

      {type === "station" ? (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder={ar ? "الموقع (اختياري)" : "Location (optional)"}
            style={inputField}
          />
          <input
            value={form.stationType}
            onChange={(event) => update("stationType", event.target.value)}
            placeholder={ar ? "نوع الفرع (اختياري)" : "Branch type (optional)"}
            style={inputField}
          />
          <div style={{ gridColumn: "1 / -1" }}>
            <StationManagerField value={form.managerId} onChange={(value) => update("managerId", value)} employees={employees} ar={ar} />
          </div>
        </div>
      ) : (
        <>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder={ar ? "البريد الإلكتروني" : "Email address"}
            style={inputField}
          />
          <label style={{ display: "block" }}>
            <span style={labelText}>{ar ? "المنصب من الجدول" : "Position from the table"}</span>
            <select
              required={positions.length > 0}
              value={positionId || ""}
              onChange={(event) => applyPosition(event.target.value)}
              style={selectField}
            >
              <option value="">{positions.length ? (ar ? "اختر منصباً" : "Choose a position") : (ar ? "لا مناصب — أنشئها من تبويب المناصب" : "No positions — create them in the Positions tab")}</option>
              {tracks.map((track) => {
                const items = positions.filter((item) => item.trackId === track.id);
                if (!items.length) return null;
                return (
                  <optgroup key={track.id} label={trackLabel(track, ar)}>
                    {items.map((position) => (
                      <option key={position.id} value={position.id}>{position.title}</option>
                    ))}
                  </optgroup>
                );
              })}
              {positions.filter((item) => !item.trackId).map((position) => (
                <option key={position.id} value={position.id}>{position.title}</option>
              ))}
            </select>
            <p style={hintText}>
              {positionId
                ? summarizePositionAccess(positions.find((item) => item.id === positionId)?.permissions, ar)
                : (ar
                  ? "المنصب يحمل صلاحيات القسم: لا يرى / خاصته / عرض / تحكم كامل."
                  : "The position carries section access: hidden / own / view / full control.")}
            </p>
          </label>

          {!positions.length || !positionId ? (
            <div>
              <span style={labelText}>{ar ? "مسمى حر إن لم يُحفظ منصب بعد" : "Free title if no position is saved yet"}</span>
              <input
                required={!positions.length}
                value={title}
                list="org-title-suggestions-create"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={ar ? "مثال: مدير عمليات الفرع" : "e.g. Branch operations manager"}
                style={inputField}
              />
              <datalist id="org-title-suggestions-create">
                {titleSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>
          ) : null}

          <label style={{ display: "block" }}>
            <span style={labelText}>{ar ? "الفرع" : "Branch"}</span>
            <select
              required
              value={branchStationId}
              onChange={(e) => setBranchStationId(e.target.value)}
              style={selectField}
            >
              <option value="">{ar ? "اختر الفرع" : "Select branch"}</option>
              {(stations || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "block" }}>
            <span style={labelText}>{ar ? "المسؤول المباشر" : "Direct manager"}</span>
            <select
              value={reportsToNodeId}
              onChange={(e) => setReportsToNodeId(e.target.value)}
              style={selectField}
            >
              <option value="">{ar ? "لا أحد — تحت الفرع مباشرة" : "None — directly under branch"}</option>
              {people.map((p) => {
                const emp = (employees || []).find((e) => e.id === p.refId);
                return (
                  <option key={p.id} value={p.id}>
                    {emp?.name || p.id}{p.title ? ` · ${p.title}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          {ownerMode && (
            <div style={{ borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", background: CARD }}>
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 14px",
                  border: "none",
                  background: CARD,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "start",
                }}
              >
                <span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>
                    {ar ? "تخصيص صلاحيات إضافية" : "Customize extra access"}
                  </span>
                  <span style={{ display: "block", marginTop: 3, fontSize: 11, color: MUTED }}>
                    {ar
                      ? `${granted} أقسام ظاهرة · للمالك عند الحاجة فقط`
                      : `${granted} sections on · owner only when needed`}
                  </span>
                </span>
                {advancedOpen
                  ? <ChevronUp style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
                  : <ChevronDown style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />}
              </button>
              {advancedOpen && (
                <div style={{ borderTop: "1px solid #E2E8F0", background: SURFACE, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  <PermissionTemplatePicker
                    data={data}
                    companyId={companyId}
                    value={templateId}
                    onSelect={onTemplate}
                    hasParent={hasParent}
                    permissions={permissions}
                    customized={customized}
                    ar={ar}
                  />
                  <SmartDepartmentGrid
                    permissions={permissions}
                    onChange={setPermissions}
                    ar={ar}
                    ownerMode={ownerMode}
                    grantable={grantable}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
