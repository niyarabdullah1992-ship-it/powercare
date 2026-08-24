import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import StationManagerField from "@/components/hr/StationManagerField";
import OrgUnitKindPicker from "@/components/hr/OrgUnitKindPicker";
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
  softPanel,
} from "@/lib/orgModalStyles";

const HR_TEMPLATE = BUILT_IN_TEMPLATES.find((t) => t.id === "hr_officer");

export default function OrgTreeNodeFields({
  type,
  title,
  setTitle,
  stationName,
  setStationName,
  managerId,
  setManagerId,
  unitKind,
  setUnitKind,
  permissions,
  setPermissions,
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
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hrOn = templateId === "hr_officer" || permissions?.hr === "manage";
  const granted = grantedCount(permissions);

  const setHr = (on) => {
    if (on) {
      onTemplate?.("hr_officer");
      if (!title.trim()) setTitle(ar ? (HR_TEMPLATE?.ar || "مسؤول موارد بشرية") : (HR_TEMPLATE?.en || "HR officer"));
    } else {
      onTemplate?.("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {type === "station" && (
        <>
          <label style={{ display: "block" }}>
            <span style={labelText}>{ar ? "اسم الفرع" : "Branch name"}</span>
            <input
              value={stationName}
              onChange={(event) => setStationName(event.target.value)}
              required
              placeholder={ar ? "اسم الفرع" : "Branch name"}
              style={inputField}
            />
          </label>
          <OrgUnitKindPicker value={unitKind} onChange={setUnitKind} ar={ar} />
          <StationManagerField value={managerId} onChange={setManagerId} employees={employees} ar={ar} />
        </>
      )}

      <label style={{ display: "block" }}>
        <span style={labelText}>
          {type === "employee" ? (ar ? "المسمى الوظيفي" : "Job title") : (ar ? "وصف العقدة" : "Node label")}
        </span>
        <input
          value={title}
          list="org-title-suggestions-edit"
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder={type === "employee" ? (ar ? "مثال: مدير عمليات الفرع" : "e.g. Branch operations manager") : (ar ? "وصف العقدة" : "Node label")}
          style={inputField}
        />
        <datalist id="org-title-suggestions-edit">
          {titleSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        {type === "employee" && (
          <p style={hintText}>
            {ar ? "اسم حر — لا يرتبط بقائمة مناصب ثابتة." : "Free name — not locked to a fixed role list."}
          </p>
        )}
      </label>

      {type === "employee" && (
        <>
          <div style={softPanel}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hrOn}
                onChange={(e) => setHr(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: ACCENT }}
              />
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>
                  {ar ? "مسؤول موارد بشرية لهذا الفرع" : "HR officer for this branch"}
                </span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, lineHeight: 1.65, color: MUTED }}>
                  {ar
                    ? "يفعّل ملء ملفات موظفي نفس الفرع."
                    : "Lets them fill employee files in the same branch."}
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
