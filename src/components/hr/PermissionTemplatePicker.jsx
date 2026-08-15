import React, { useState } from "react";
import { BookmarkPlus, ChevronDown, ChevronUp } from "lucide-react";
import {
  CUSTOM_TEMPLATE_ID,
  INHERIT_TEMPLATE_ID,
  companyTemplates,
  saveCompanyTemplate,
  templateLabel,
} from "@/lib/permissionTemplates";
import { ACCENT, MUTED, NAVY, SURFACE, CARD } from "@/lib/platformStyles";

export default function PermissionTemplatePicker({
  data,
  companyId,
  value,
  onSelect,
  hasParent,
  permissions,
  customized,
  ar,
}) {
  const templates = companyTemplates(data);
  const isCustom = !value || value === CUSTOM_TEMPLATE_ID;
  const [showExamples, setShowExamples] = useState(false);

  const saveAsNew = () => {
    const name = window.prompt(
      ar ? "اسم التوزيع لحفظه وإعادة استخدامه" : "Name this access mix to reuse later",
    );
    if (name?.trim()) saveCompanyTemplate(companyId, name.trim(), permissions);
  };

  const tile = (active) => ({
    borderRadius: 12,
    border: active ? `1px solid color-mix(in oklab, ${ACCENT} 45%, #fff)` : "1px solid #E2E8F0",
    background: active ? "color-mix(in oklab, #1E9E63 10%, #fff)" : SURFACE,
    boxShadow: active ? "inset 3px 0 0 #1E9E63" : "none",
    padding: "12px 14px",
    textAlign: "start",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #E2E8F0",
        background: CARD,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
            {ar ? "توزيع الصلاحيات" : "Access mix"}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11, lineHeight: 1.65, color: MUTED, maxWidth: 420 }}>
            {ar
              ? "سمِّ المنصب أعلاه، ثم اختر أقسام الموقع — المسمى حر والصلاحيات مركّبة."
              : "Name the position above, then pick site sections — title is free, access is composed."}
          </p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            borderRadius: 8,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 600,
            background: isCustom || customized ? "#ECFDF3" : SURFACE,
            color: isCustom || customized ? "#14683F" : MUTED,
          }}
        >
          {isCustom || customized ? (ar ? "منصب مخصص" : "Custom position") : (ar ? "من مثال" : "From example")}
        </span>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 8, gridTemplateColumns: hasParent ? "1fr 1fr" : "1fr" }}>
        <button type="button" onClick={() => onSelect(CUSTOM_TEMPLATE_ID)} style={tile(isCustom)}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY }}>
            {ar ? "مخصص" : "Custom"}
          </span>
          <span style={{ display: "block", marginTop: 3, fontSize: 10, color: MUTED, lineHeight: 1.45 }}>
            {ar ? "أنت تسمي وتوزّع — الافتراضي" : "You name and distribute — default"}
          </span>
        </button>
        {hasParent && (
          <button type="button" onClick={() => onSelect(INHERIT_TEMPLATE_ID)} style={tile(value === INHERIT_TEMPLATE_ID)}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY }}>
              {ar ? "مثل الأعلى" : "Like parent"}
            </span>
            <span style={{ display: "block", marginTop: 3, fontSize: 10, color: MUTED, lineHeight: 1.45 }}>
              {ar ? "صلاحيات أقل بدرجة من المسؤول" : "One step below the manager"}
            </span>
          </button>
        )}
      </div>

      <div style={{ marginTop: 12, borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", background: SURFACE }}>
        <button
          type="button"
          onClick={() => setShowExamples((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "start",
          }}
        >
          <span>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY }}>
              {ar ? "أمثلة للبدء (اختياري)" : "Starter examples (optional)"}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 10, color: MUTED }}>
              {ar ? "تملأ الأقسام فقط — لا تفرض اسم المنصب" : "Fills sections only — does not lock the title"}
            </span>
          </span>
          {showExamples
            ? <ChevronUp style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />
            : <ChevronDown style={{ width: 16, height: 16, color: ACCENT, flexShrink: 0 }} />}
        </button>
        {showExamples && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 12px 12px", borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
            {templates.map((template) => {
              const active = value === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template.id)}
                  style={{
                    borderRadius: 999,
                    padding: "7px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    border: active ? "none" : "1px solid #E2E8F0",
                    background: active ? NAVY : CARD,
                    color: active ? "#fff" : NAVY,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {templateLabel(template, ar)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={saveAsNew}
        style={{
          marginTop: 12,
          height: 36,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 9,
          border: `1px dashed color-mix(in oklab, ${ACCENT} 50%, #fff)`,
          background: CARD,
          padding: "0 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "#14683F",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <BookmarkPlus style={{ width: 14, height: 14 }} />
        {ar ? "حفظ هذا التوزيع لإعادة الاستخدام" : "Save this mix to reuse"}
      </button>
    </div>
  );
}
