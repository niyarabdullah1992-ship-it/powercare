import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateEmployeeProfile } from "@/lib/store";
import {
  PROFILE_GROUPS,
  canEditProfileKey,
  canonicalFieldValue,
  displayProfileField,
  isProfileFieldVisible,
  profileFieldLabel,
  profileFieldOptions,
  profileFieldValue,
} from "@/lib/employeeProfileFields";
import MobileSelect from "@/components/mobile/MobileSelect";
import { MUTED, NAVY, NAVY_FILL, OK, WARN, BAD, field, cardShell, CARD } from "@/lib/platformStyles";

export { PROFILE_GROUPS };

function daysTo(iso) {
  if (!iso) return null;
  const d = Math.round((new Date(`${String(iso).slice(0, 10)}T00:00:00`) - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

function expiryChip(iso, ar) {
  const d = daysTo(iso);
  if (d === null) return null;
  if (d < 0) return { text: ar ? "منتهٍ" : "Expired", style: BAD };
  if (d <= 60) return { text: ar ? `${d} يومًا` : `${d} days`, style: WARN };
  return { text: ar ? "ساري" : "Valid", style: OK };
}

function niceDate(iso, ar) {
  if (!iso) return "";
  try {
    return new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString(
      ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" },
    );
  } catch {
    return String(iso).slice(0, 10);
  }
}

const inputStyle = { ...field };

/** Platform isTabInfo — L2669–2692, grouped to MHRSD employee-file order. */
export default function ProfessionalInfoTab({
  employee,
  companyId,
  canEdit,
  isSelf,
  canEditGrade,
  grades,
  fallbackPosition,
  stationName,
  autoEdit = false,
}) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const canManage = Boolean(canEdit);
  const canFill = canManage;
  const [editing, setEditing] = useState(Boolean(autoEdit && canFill));
  const profile = employee.profile || {};

  useEffect(() => {
    if (autoEdit && canFill) setEditing(true);
  }, [autoEdit, canFill]);

  const allFields = PROFILE_GROUPS.flatMap((g) => g.fields);
  const allKeys = allFields.map((f) => f.key);
  const [form, setForm] = useState(() => ({
    ...allFields.reduce((acc, fieldDef) => {
      let v = profileFieldValue(profile, fieldDef.key, employee);
      if (fieldDef.key === "position") v = profile.position || fallbackPosition || "";
      return { ...acc, [fieldDef.key]: canonicalFieldValue(fieldDef, v) };
    }, {}),
    gradeId: profile.gradeId || "",
    maxStations: profile.maxStations ?? "",
  }));

  const readVal = (key) => {
    if (key === "position") return profile.position || fallbackPosition || "";
    return profileFieldValue(profile, key, employee);
  };

  const displayVal = (fieldDef) => {
    const raw = editing ? form[fieldDef.key] : readVal(fieldDef.key);
    if (!raw) return "—";
    if (fieldDef.type === "date" && !editing) return niceDate(raw, ar) || "—";
    const labelled = displayProfileField(fieldDef, raw, ar);
    return labelled || raw;
  };

  const save = () => {
    const payload = { ...form, maxStations: form.maxStations === "" ? null : Number(form.maxStations) };
    if (!canEditGrade) {
      delete payload.gradeId;
      delete payload.maxStations;
    }
    if (!canManage) {
      allKeys.forEach((key) => delete payload[key]);
      delete payload.gradeId;
      delete payload.maxStations;
      return;
    }
    allKeys.forEach((key) => {
      if (!canEditProfileKey(key, { canManage, isSelf })) delete payload[key];
    });
    updateEmployeeProfile(companyId, employee.id, payload);
    setEditing(false);
  };

  const ghostBtn = {
    padding: "7px 13px",
    borderRadius: "9px",
    border: "1px solid #E2E8F0",
    background: CARD,
    color: MUTED,
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const primaryBtn = {
    ...ghostBtn,
    background: NAVY_FILL,
    color: "#fff",
    border: "none",
    fontWeight: 600,
  };

  const gradeCard = (canEditGrade || profile.gradeId || profile.maxStations) ? (
    <div style={cardShell}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{t("gradeAndStationScope")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px", marginTop: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", color: MUTED }}>{t("jobGrade")}</div>
          <div style={{ marginTop: "6px" }}>
            {editing && canEditGrade ? (
              <MobileSelect
                value={form.gradeId}
                onChange={(gradeId) => setForm({ ...form, gradeId })}
                options={[{ value: "", label: "—" }, ...grades.map((g) => ({ value: g.id, label: `${g.gradeNumber} · ${g.title}` }))]}
              />
            ) : (
              <span style={{ fontSize: "13px", color: NAVY }}>
                {grades.find((g) => g.id === profile.gradeId)
                  ? `${grades.find((g) => g.id === profile.gradeId).gradeNumber} · ${grades.find((g) => g.id === profile.gradeId).title}`
                  : "—"}
              </span>
            )}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: MUTED }}>{t("maxStations")}</div>
          <div style={{ marginTop: "6px" }}>
            {editing && canEditGrade ? (
              <input
                type="number"
                min="1"
                value={form.maxStations}
                onChange={(e) => setForm({ ...form, maxStations: e.target.value })}
                placeholder="∞"
                style={inputStyle}
              />
            ) : (
              <span style={{ fontSize: "13px", color: NAVY }}>{profile.maxStations || "∞"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }} dir={ar ? "rtl" : "ltr"}>
      <div style={cardShell}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
          {ar ? "ملف العامل وفق سياسة الوزارة" : "Employee file — MHRSD order"}
        </div>
        <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.7, textWrap: "pretty" }}>
          {ar
            ? "يُرتَّب الملف كما تفحصه وزارة الموارد البشرية والتنمية الاجتماعية: الهوية والجوازات، ثم التأمينات والضمان الصحي، ثم التوظيف في قوى وحماية الأجور. العقد والأجر والإجازات والشهادات تلي هذا السجل."
            : "The file follows MHRSD inspection order: identity and Jawazat, then GOSI and medical cover, then Qiwa employment and wage protection. Contract, pay, leave, and certificates follow this register."}
        </div>
      </div>

      {isSelf && !canManage && (
        <p style={{ margin: 0, fontSize: "12px", color: MUTED, lineHeight: 1.7 }}>
          {ar
            ? "ملف المعلومات المهنية للعرض فقط — تُكمله الإدارة أو الموارد البشرية."
            : "Professional info is view-only — management or HR completes this file."}
        </p>
      )}

      {(canFill || canEditGrade) && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} style={ghostBtn}>
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button type="button" onClick={save} style={primaryBtn}>
                {t("save")}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} style={ghostBtn}>
              {t("edit")}
            </button>
          )}
        </div>
      )}

      {PROFILE_GROUPS.map((group) => {
        const fields = group.fields.filter((f) => isProfileFieldVisible(f, { profile, form, editing }));
        const idType = editing ? form.idType : readVal("idType");
        return (
          <React.Fragment key={group.id}>
            <div style={cardShell}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
                {ar ? group.ar : group.en}
              </div>
              {group.noteAr && (
                <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.6, textWrap: "pretty" }}>
                  {ar ? group.noteAr : group.noteEn}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px", marginTop: "16px" }}>
                {group.showStation && (
                  <div>
                    <div style={{ fontSize: "11px", color: MUTED }}>
                      {ar ? "الفرع" : "Branch"}
                      <span style={{ marginInlineStart: 6, fontSize: 10, color: "#94A3B8" }}>
                        {ar ? "· من الهيكل" : "· from org tree"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <span style={{ flex: 1, fontSize: "13px", color: NAVY, minWidth: 0, wordBreak: "break-word" }}>
                        {stationName || "—"}
                      </span>
                    </div>
                  </div>
                )}
                {fields.map((fieldDef) => {
                  const canEditField = editing && canEditProfileKey(fieldDef.key, { canManage, isSelf });
                  const chip = !editing && fieldDef.expiry ? expiryChip(readVal(fieldDef.key), ar) : null;
                  const opts = profileFieldOptions(fieldDef);
                  return (
                    <div key={fieldDef.key} style={fieldDef.area ? { gridColumn: "1 / -1" } : undefined}>
                      <div style={{ fontSize: "11px", color: MUTED }}>
                        {profileFieldLabel(fieldDef, idType, ar)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                        {canEditField ? (
                          fieldDef.area ? (
                            <textarea
                              value={form[fieldDef.key]}
                              onChange={(e) => setForm({ ...form, [fieldDef.key]: e.target.value })}
                              rows={3}
                              dir={fieldDef.dir}
                              style={{ ...inputStyle, height: "auto", padding: "10px 11px", resize: "vertical" }}
                            />
                          ) : opts ? (
                            <select
                              value={form[fieldDef.key]}
                              onChange={(e) => setForm({ ...form, [fieldDef.key]: e.target.value })}
                              style={inputStyle}
                            >
                              <option value="">—</option>
                              {opts.map((o) => (
                                <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fieldDef.type || "text"}
                              dir={fieldDef.dir}
                              value={form[fieldDef.key]}
                              onChange={(e) => setForm({ ...form, [fieldDef.key]: e.target.value })}
                              style={inputStyle}
                            />
                          )
                        ) : (
                          <>
                            <span
                              dir={fieldDef.dir && displayVal(fieldDef) !== "—" ? fieldDef.dir : "auto"}
                              style={{ flex: 1, fontSize: "13px", color: NAVY, minWidth: 0, wordBreak: "break-word" }}
                            >
                              {displayVal(fieldDef)}
                            </span>
                            {chip && <span style={chip.style}>{chip.text}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {group.id === "employment" ? gradeCard : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
