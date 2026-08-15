import React from "react";
import {
  BarChart3,
  Briefcase,
  ClipboardCheck,
  FileText,
  FolderOpen,
  ListTodo,
  Lock,
  Megaphone,
  MessageSquare,
  PenLine,
  Camera,
  ReceiptText,
  ShieldQuestion,
  Sparkles,
  Trophy,
  UserCog,
  Warehouse,
  Banknote,
  CalendarClock,
  CalendarOff,
  Network,
  Settings2,
  LayoutDashboard,
} from "lucide-react";
import { SMART_DEPARTMENTS, SMART_SECTION_GROUPS } from "@/lib/smartPositions";
import { OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";
import { ACCENT, MUTED, NAVY, SURFACE, CARD } from "@/lib/platformStyles";

const ICONS = {
  command: LayoutDashboard,
  tasks: ListTodo,
  attendance: ClipboardCheck,
  shifts: CalendarClock,
  leave: CalendarOff,
  org: Network,
  settings: Settings2,
  daily_report: FileText,
  chat: MessageSquare,
  performance: Trophy,
  hr: UserCog,
  hiring: Briefcase,
  safety: ShieldQuestion,
  work_proof: Camera,
  signing: PenLine,
  complaints: Megaphone,
  expenses: ReceiptText,
  inventory: Warehouse,
  payroll: Banknote,
  reports: BarChart3,
  files: FolderOpen,
  assistant: Sparkles,
};

/**
 * Platform-identity section composer — same labels as the live sidebar.
 */
export default function SmartDepartmentGrid({
  permissions,
  onChange,
  ar,
  disabled = false,
  ownerMode = true,
  grantable = null,
}) {
  const setAccess = (id, access) => {
    const next = { ...permissions };
    if (access === "hidden") delete next[id];
    else next[id] = access;
    onChange(next);
  };

  const ceilingFor = (id) => {
    if (!ownerMode && OWNER_ONLY_DEPARTMENTS.includes(id)) return "hidden";
    if (!grantable) return "manage";
    return grantable[id] || "hidden";
  };

  const active = SMART_DEPARTMENTS.filter((d) => permissions[d.id] && permissions[d.id] !== "hidden");

  const toggleOn = (id) => {
    if (disabled) return;
    const ceiling = ceilingFor(id);
    if (ceiling === "hidden") return;
    const current = permissions[id];
    if (current && current !== "hidden") setAccess(id, "hidden");
    else setAccess(id, "view");
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "أقسام الموقع لهذا المنصب" : "Site sections for this position"}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, lineHeight: 1.65, color: MUTED }}>
          {ar
            ? "نفس أسماء القائمة الجانبية — اختر ما يظهر، ثم عرض أو إدارة."
            : "Same names as the sidebar — choose what appears, then view or manage."}
        </p>
      </div>

      {SMART_SECTION_GROUPS.map((group) => {
        const items = SMART_DEPARTMENTS.filter((d) => d.group === group.id);
        if (!items.length) return null;
        return (
          <section key={group.id}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 8 }}>
              {ar ? group.ar : group.en}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                gap: 8,
              }}
            >
              {items.map((department) => {
                const Icon = ICONS[department.id] || ListTodo;
                const ceiling = ceilingFor(department.id);
                const locked = ceiling === "hidden";
                const on = Boolean(permissions[department.id] && permissions[department.id] !== "hidden");
                return (
                  <button
                    key={department.id}
                    type="button"
                    disabled={disabled || locked}
                    onClick={() => toggleOn(department.id)}
                    title={ar ? department.hintAr : department.hintEn}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      textAlign: "start",
                      padding: "12px 12px",
                      borderRadius: 12,
                      border: on ? `1px solid color-mix(in oklab, ${ACCENT} 45%, #fff)` : "1px solid #E2E8F0",
                      background: on ? "color-mix(in oklab, #1E9E63 10%, #fff)" : CARD,
                      boxShadow: on ? "inset 3px 0 0 #1E9E63" : "none",
                      cursor: locked || disabled ? "not-allowed" : "pointer",
                      opacity: locked ? 0.55 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: on ? "#ECFDF3" : SURFACE,
                        color: on ? ACCENT : MUTED,
                      }}
                    >
                      {locked
                        ? <Lock style={{ width: 15, height: 15 }} strokeWidth={1.75} />
                        : <Icon style={{ width: 15, height: 15 }} strokeWidth={1.75} />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, lineHeight: 1.35 }}>
                        {ar ? department.ar : department.en}
                      </span>
                      <span style={{ display: "block", marginTop: 3, fontSize: 10, color: MUTED, lineHeight: 1.45 }}>
                        {ar ? department.hintAr : department.hintEn}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {active.length === 0 ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px dashed #E2E8F0",
            background: SURFACE,
            padding: "22px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
            {ar ? "لم يُختر أي قسم بعد" : "No sections chosen yet"}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: MUTED }}>
            {ar ? "المنصب المخصص يبدأ فارغًا — اختر من أقسام الموقع أعلاه." : "Custom positions start empty — pick from the site sections above."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>
            {ar ? `مستوى الوصول · ${active.length}` : `Access level · ${active.length}`}
          </div>
          {active.map((department) => {
            const Icon = ICONS[department.id] || ListTodo;
            const access = permissions[department.id] || "view";
            const canManage = ceilingFor(department.id) === "manage";
            return (
              <div
                key={department.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  background: CARD,
                  boxShadow: `inset 3px 0 0 ${access === "manage" ? ACCENT : NAVY}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#ECFDF3",
                      color: ACCENT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 15, height: 15 }} strokeWidth={1.75} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                    {ar ? department.ar : department.en}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "inline-flex", padding: 3, borderRadius: 9, background: SURFACE, gap: 2 }}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setAccess(department.id, "view")}
                      style={{
                        height: 30,
                        padding: "0 12px",
                        borderRadius: 7,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        background: access === "view" ? NAVY : "transparent",
                        color: access === "view" ? "#fff" : MUTED,
                      }}
                    >
                      {ar ? "عرض" : "View"}
                    </button>
                    <button
                      type="button"
                      disabled={disabled || !canManage}
                      onClick={() => setAccess(department.id, "manage")}
                      style={{
                        height: 30,
                        padding: "0 12px",
                        borderRadius: 7,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        cursor: canManage ? "pointer" : "not-allowed",
                        opacity: canManage ? 1 : 0.4,
                        background: access === "manage" ? ACCENT : "transparent",
                        color: access === "manage" ? "#fff" : MUTED,
                      }}
                    >
                      {ar ? "إدارة" : "Manage"}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setAccess(department.id, "hidden")}
                    style={{
                      height: 30,
                      padding: "0 8px",
                      border: "none",
                      background: "transparent",
                      fontSize: 11,
                      color: MUTED,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {ar ? "إزالة" : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
