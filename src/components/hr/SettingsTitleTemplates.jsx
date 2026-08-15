import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { collectJobTitles, checkRemoveTitleGate, titleSlug } from "@/lib/orgDerivations";
import { removeCompanyJobTitle } from "@/lib/orgTree";
import { rememberJobTitle } from "@/lib/permMatrixStore";
import {
  GRANTABLE_DEPARTMENTS,
  applyTitleSectionAccess,
  titleSectionAccess,
} from "@/lib/smartPositions";
import { OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";
import { toast } from "@/components/ui/use-toast";
import { MUTED, NAVY, field, CARD, SURFACE } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";

const ACCESS_LABEL = {
  hidden: { ar: "لا يرى", en: "Hidden", fullAr: "لا يرى القسم", fullEn: "Cannot see the section" },
  own: { ar: "خاصته", en: "Own", fullAr: "سجلاته هو فقط", fullEn: "Own records only" },
  station: { ar: "فرعه", en: "Branch", fullAr: "فرعه فقط", fullEn: "Their branch only" },
  view: { ar: "عرض", en: "View", fullAr: "يرى القسم في الشركة", fullEn: "Can see the section company-wide" },
  manage: { ar: "تحكم كامل", en: "Control", fullAr: "يعمل في القسم بالكامل", fullEn: "Full control of the section" },
  mixed: { ar: "متعدد", en: "Mixed", fullAr: "الأشخاص بهذا المسمى مختلفون", fullEn: "People with this title differ" },
};

function accessStyle(access) {
  if (access === "manage") return { background: "#ECFDF3", color: "#166534", border: "1px solid #BBF7D0" };
  if (access === "view") return { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" };
  if (access === "station") return { background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" };
  if (access === "own" || access === "mixed") return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
  return { background: CARD, color: MUTED, border: "1px solid #E2E8F0" };
}

export default function SettingsTitleTemplates({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";

  const titles = useMemo(
    () => collectJobTitles(data, data?.removedTitles),
    [data],
  );

  const colTemplate = `minmax(180px,1.4fr) repeat(${Math.max(titles.length, 1)},minmax(96px,1fr))`;

  const applyCell = (title, departmentId, access) => {
    if (!company?.id || !isSenior) return;
    if (!ownerMode && OWNER_ONLY_DEPARTMENTS.includes(departmentId)) {
      toast({
        description: ar ? "هذا القسم للمالك فقط." : "Only the owner can grant this section.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const applied = applyTitleSectionAccess(company.id, title.label, departmentId, access);
    refresh?.();
    toast({
      description: applied
        ? (ar ? `طُبّق على ${applied} موظف بهذا المسمى.` : `Applied to ${applied} people with this title.`)
        : (ar ? "لا موظف بهذا المسمى بعد — سيُطبَّق عند تعيينه." : "No one holds this title yet — it will apply when assigned."),
    });
    setBusy(false);
  };

  const addTitle = () => {
    const label = newTitle.trim();
    if (!label || !company?.id) return;
    const gate = checkRemoveTitleGate(label);
    if (!gate.ok && gate.error === "SYSTEM_TITLE") {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    if (titles.some((item) => item.id === titleSlug(label))) {
      toast({ description: ar ? "هذا المسمى موجود أصلًا." : "That title is already listed." });
      return;
    }
    rememberJobTitle(company.id, label);
    refresh?.();
    setNewTitle("");
    toast({ description: ar ? `أُضيف مسمى ${label}` : `Added ${label}` });
  };

  const removeTitle = (title) => {
    const gate = checkRemoveTitleGate(title.label || title.id);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    const ok = window.confirm(
      ar
        ? `حذف مسمى «${title.label}» من البطاقات والقوالب؟`
        : `Remove “${title.label}” from cards and templates?`,
    );
    if (!ok) return;
    removeCompanyJobTitle(company.id, title.label || title.id);
    refresh?.();
    toast({ description: ar ? `حُذف مسمى ${title.label}` : `Removed ${title.label}` });
  };

  return (
    <ChromeBox padded={false}>
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
          {ar ? "قوالب المسمى الوظيفي" : "Job-title templates"}
        </div>
        <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.65, maxWidth: 720 }}>
          {ar
            ? "نفس أقسام منح الشخص: عرض أو إدارة. التغيير يُطبَّق على كل من يحمل هذا المسمى."
            : "Same sections as a person grant: view or manage. A change applies to everyone who holds that title."}
        </div>
        {isSenior ? (
          <form
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}
            onSubmit={(event) => {
              event.preventDefault();
              addTitle();
            }}
          >
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={ar ? "مسمى جديد — مثل منسق الفرع" : "New title — e.g. branch coordinator"}
              style={{ ...field, maxWidth: 280 }}
            />
            <button
              type="submit"
              disabled={busy || !newTitle.trim()}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "1px solid #E2E8F0",
                background: CARD,
                color: NAVY,
                fontSize: 12,
                fontWeight: 600,
                cursor: busy || !newTitle.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: busy || !newTitle.trim() ? 0.6 : 1,
              }}
            >
              {ar ? "أضف مسمى" : "Add title"}
            </button>
          </form>
        ) : null}
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: `${Math.max(520, 200 + titles.length * 110)}px` }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: colTemplate,
              gap: "10px",
              padding: "10px 20px",
              background: SURFACE,
              borderTop: "1px solid #E2E8F0",
              borderBottom: "1px solid #E2E8F0",
              fontSize: "10px",
              letterSpacing: "0.04em",
              color: MUTED,
              fontWeight: 600,
            }}
          >
            <div>{ar ? "القسم" : "Section"}</div>
            {titles.length ? titles.map((title) => (
              <div key={title.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  {title.label}
                  {title.count > 0 ? (
                    <span style={{ display: "block", fontWeight: 500, letterSpacing: 0, marginTop: 2 }}>
                      {ar ? `${title.count} موظف` : `${title.count} staff`}
                    </span>
                  ) : null}
                </div>
                {isSenior ? (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={ar ? `حذف ${title.label}` : `Remove ${title.label}`}
                    onClick={() => removeTitle(title)}
                    style={{
                      width: 18,
                      height: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      background: CARD,
                      color: MUTED,
                      cursor: busy ? "wait" : "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                ) : null}
              </div>
            )) : (
              <div>{ar ? "أضف مسمى ليظهر كعمود" : "Add a title to show a column"}</div>
            )}
          </div>
          {GRANTABLE_DEPARTMENTS.map((department) => (
            <div
              key={department.id}
              style={{
                display: "grid",
                gridTemplateColumns: colTemplate,
                gap: "10px",
                padding: "11px 20px",
                borderBottom: "1px solid #F1F5F9",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "13px", color: NAVY }}>{ar ? department.ar : department.en}</div>
              {titles.map((title) => {
                const access = titleSectionAccess(data, title.label, department.id);
                const lab = ACCESS_LABEL[access] || ACCESS_LABEL.hidden;
                const locked = !ownerMode && OWNER_ONLY_DEPARTMENTS.includes(department.id);
                if (!isSenior || locked) {
                  return (
                    <span key={title.id} title={ar ? lab.fullAr : lab.fullEn} style={{ ...accessStyle(access), display: "inline-flex", alignItems: "center", height: 28, padding: "0 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                      {ar ? lab.ar : lab.en}
                    </span>
                  );
                }
                return (
                  <select
                    key={title.id}
                    disabled={busy}
                    title={ar ? lab.fullAr : lab.fullEn}
                    value={access === "mixed" ? "mixed" : access}
                    onChange={(event) => applyCell(title, department.id, event.target.value)}
                    style={{
                      ...accessStyle(access),
                      cursor: busy ? "wait" : "pointer",
                      height: 28,
                      padding: "0 8px",
                      fontFamily: "inherit",
                      appearance: "auto",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {access === "mixed" ? <option value="mixed" disabled>{ar ? ACCESS_LABEL.mixed.ar : ACCESS_LABEL.mixed.en}</option> : null}
                    {["hidden", "own", "station", "view", "manage"].map((option) => (
                      <option key={option} value={option}>
                        {ar ? ACCESS_LABEL[option].ar : ACCESS_LABEL[option].en} — {ar ? ACCESS_LABEL[option].fullAr : ACCESS_LABEL[option].fullEn}
                      </option>
                    ))}
                  </select>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ChromeBox>
  );
}
