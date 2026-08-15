import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";
import PermissionTemplatePicker from "@/components/hr/PermissionTemplatePicker";
import { BUILT_IN_TEMPLATES, grantedCount } from "@/lib/permissionTemplates";
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
  softPanel,
} from "@/lib/orgModalStyles";

const HR_TEMPLATE = BUILT_IN_TEMPLATES.find((t) => t.id === "hr_officer");

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
  hrRole,
  setHrRole,
}) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const people = (data.orgTree || []).filter((n) => n.type === "employee");
  const granted = grantedCount(permissions);

  const applyHr = (on) => {
    setHrRole(on);
    if (on) {
      onTemplate?.("hr_officer");
      if (!title.trim()) setTitle(ar ? (HR_TEMPLATE?.ar || "مسؤول موارد بشرية") : (HR_TEMPLATE?.en || "HR officer"));
    } else if (!advancedOpen) {
      onTemplate?.("");
    }
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
          <div>
            <span style={labelText}>{ar ? "المسمى الوظيفي" : "Job title"}</span>
            <input
              required
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
            <p style={hintText}>
              {ar ? "اسم حر — لا يرتبط بقائمة مناصب ثابتة." : "Free name — not locked to a fixed role list."}
            </p>
          </div>

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

          <div style={softPanel}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hrRole}
                onChange={(e) => applyHr(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: ACCENT }}
              />
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>
                  {ar ? "مسؤول موارد بشرية لهذا الفرع" : "HR officer for this branch"}
                </span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, lineHeight: 1.65, color: MUTED }}>
                  {ar
                    ? "يفعّل ملء ملفات موظفي نفس الفرع. ملف الموظف نفسه يُكمَل من الإدارة."
                    : "Lets them fill employee files in the same branch. The file itself is completed by management."}
                </span>
              </span>
            </label>
          </div>

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
