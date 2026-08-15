import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { ChromeBox } from "@/components/shared/IdentityCard";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import PermissionTemplatePicker from "@/components/hr/PermissionTemplatePicker";
import {
  BUILT_IN_TEMPLATES,
  CUSTOM_TEMPLATE_ID,
  grantedCount,
  templateById,
} from "@/lib/permissionTemplates";
import {
  saveSmartPosition,
  scorePermissions,
  suggestSmartTitle,
} from "@/lib/smartPositions";
import { ACCENT, BORDER, MUTED, NAVY, SURFACE, field, ui } from "@/lib/platformStyles";

function personTitle(employee) {
  return String(employee?.profile?.position || employee?.position || employee?.jobTitle || employee?.title || "").trim();
}

export default function SettingsPersonAccessCard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const employees = data?.employees || [];
  const positions = data?.smartPositions || [];
  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";

  const [query, setQuery] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [permissions, setPermissions] = useState({});
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState(CUSTOM_TEMPLATE_ID);
  const [hint, setHint] = useState("");

  const grantedPeople = useMemo(() => (
    positions
      .filter((item) => grantedCount(item.permissions) > 0)
      .map((item) => ({
        ...item,
        employee: employees.find((employee) => employee.id === item.employeeId),
      }))
      .filter((item) => item.employee)
      .sort((a, b) => String(a.employee.name || "").localeCompare(String(b.employee.name || ""), "ar"))
  ), [positions, employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ar");
    return employees
      .filter((employee) => employee.id !== data?.ownerId)
      .filter((employee) => {
        if (!q) return true;
        const hay = `${employee.name || ""} ${personTitle(employee)} ${employee.role || ""}`.toLocaleLowerCase("ar");
        return hay.includes(q);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ar"));
  }, [employees, query, data?.ownerId]);

  const selected = employees.find((employee) => employee.id === employeeId) || null;

  const loadPerson = (id) => {
    const employee = employees.find((item) => item.id === id) || null;
    const saved = positions.find((item) => item.employeeId === id);
    setEmployeeId(id);
    setPermissions({ ...(saved?.permissions || {}) });
    setTitle(saved?.title || personTitle(employee) || "");
    setTemplateId(CUSTOM_TEMPLATE_ID);
    setHint("");
  };

  const applyTemplate = (id) => {
    setTemplateId(id);
    if (!id) return;
    const tpl = templateById(data, id) || BUILT_IN_TEMPLATES.find((item) => item.id === id);
    if (!tpl) return;
    setPermissions({ ...(tpl.permissions || {}) });
    if (!title.trim()) setTitle(ar ? tpl.ar : tpl.en);
  };

  const persist = (nextPerms, nextTitle, cleared = false) => {
    if (!company?.id || !employeeId || !isSenior) return;
    const label = String(nextTitle || "").trim() || suggestSmartTitle(nextPerms, ar);
    if (cleared || grantedCount(nextPerms) === 0) {
      saveSmartPosition(company.id, employeeId, label, {});
    } else {
      saveSmartPosition(company.id, employeeId, label, nextPerms, Boolean(label));
    }
    refresh?.();
    setHint(cleared
      ? (ar ? "أُعيدت صلاحيات هذا الشخص إلى دوره في النظام." : "This person is back to their system role.")
      : (ar ? "حُفظت. الأقسام المختارة تظهر له في القائمة فورًا." : "Saved. The chosen sections appear in their menu immediately."));
  };

  if (!isSenior) {
    return (
      <ChromeBox>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "منح صلاحيات لشخص" : "Grant access to a person"}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          {ar
            ? "يحدد المالك أو المدير أو العمليات من يرى أي قسم. أنت ترى القائمة الحالية فقط."
            : "The owner, director, or operations grants who sees which section. You are viewing the current list only."}
        </p>
        {grantedPeople.length ? (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {grantedPeople.map((item) => (
              <div key={item.employeeId} style={{ fontSize: 13, color: NAVY }}>
                {item.employee.name}
                <span style={{ marginInlineStart: 8, fontSize: 11, color: MUTED }}>
                  {ar ? `${grantedCount(item.permissions)} أقسام` : `${grantedCount(item.permissions)} sections`}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </ChromeBox>
    );
  }

  return (
    <ChromeBox>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
        {ar ? "منح صلاحيات لشخص" : "Grant access to a person"}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7, maxWidth: 720 }}>
        {ar
          ? "اختر موظفًا، ثم ركّب أقسامه بندًا بندًا — عرض أو إدارة. القوالب أدناه تطبق نفس المنح على كل من يحمل المسمى."
          : "Pick an employee, then compose their sections one by one — view or manage. Templates below apply the same grants to everyone who holds that title."}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
        <div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? "ابحث عن موظف…" : "Search an employee…"}
            style={{ ...field, marginBottom: 8 }}
          />
          <div
            style={{
              maxHeight: 360,
              overflowY: "auto",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              background: SURFACE,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: MUTED }}>
                {ar ? "لا موظف بهذا الاسم." : "No employee matches."}
              </div>
            ) : filtered.map((employee) => {
              const saved = positions.find((item) => item.employeeId === employee.id);
              const count = grantedCount(saved?.permissions);
              const on = employee.id === employeeId;
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => loadPerson(employee.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "start",
                    padding: "10px 12px",
                    border: "none",
                    borderBottom: `1px solid ${BORDER}`,
                    background: on ? "var(--nv-accent-soft, #E8F6EE)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>{employee.name}</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 11, color: MUTED }}>
                    {personTitle(employee) || (ar ? "بلا مسمى" : "No title")}
                    {count ? ` · ${ar ? `${count} أقسام` : `${count} sections`}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {!selected ? (
            <div
              style={{
                border: `1px dashed ${BORDER}`,
                borderRadius: 12,
                background: SURFACE,
                padding: "28px 16px",
                textAlign: "center",
                color: MUTED,
                fontSize: 13,
              }}
            >
              {ar ? "اختر موظفًا من القائمة لمنحه أقسامًا." : "Choose an employee from the list to grant sections."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11, color: MUTED, marginBottom: 6 }}>
                  {ar ? "مسمى يظهر له" : "Title shown to them"}
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={ar ? "مثال: منسق عمليات الفرع" : "e.g. Branch operations coordinator"}
                  style={field}
                />
              </label>

              <PermissionTemplatePicker
                data={data}
                companyId={company?.id}
                value={templateId}
                onSelect={applyTemplate}
                hasParent={false}
                permissions={permissions}
                customized={grantedCount(permissions) > 0 && !templateId}
                ar={ar}
              />

              <SmartDepartmentGrid
                permissions={permissions}
                onChange={(next) => {
                  setPermissions(next);
                  setTemplateId(CUSTOM_TEMPLATE_ID);
                }}
                ar={ar}
                ownerMode={ownerMode}
              />

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => persist(permissions, title)}
                  style={ui.btnPrimary}
                >
                  {ar ? "احفظ صلاحيات هذا الشخص" : "Save this person's access"}
                </button>
                {grantedCount(permissions) > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPermissions({});
                      setTemplateId(CUSTOM_TEMPLATE_ID);
                      persist({}, title, true);
                    }}
                    style={ui.btnGhost}
                  >
                    {ar ? "أزل المنح وأعده لدوره" : "Clear grants — back to role"}
                  </button>
                ) : null}
                <span style={{ fontSize: 11, color: MUTED }}>
                  {ar
                    ? `${grantedCount(permissions)} أقسام · وزن ${scorePermissions(permissions)}`
                    : `${grantedCount(permissions)} sections · weight ${scorePermissions(permissions)}`}
                </span>
              </div>
              {hint ? <p style={{ margin: 0, fontSize: 11, color: ACCENT }}>{hint}</p> : null}
            </div>
          )}
        </div>
      </div>
    </ChromeBox>
  );
}
