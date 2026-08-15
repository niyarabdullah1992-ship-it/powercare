import React, { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  ORG_ROLES,
  ORG_SECTIONS,
  ORG_SECTION_LABELS,
  SCOPE,
  checkSetPermGate,
  checkRemoveTitleGate,
  collectJobTitles,
  derivePermissionMatrix,
  effectiveTitleScope,
  grantableScope,
  titleSlug,
} from "@/lib/orgDerivations";
import { removeCompanyJobTitle } from "@/lib/orgTree";
import {
  forgetJobTitleOverrides,
  isMissingRemote,
  readPermMatrix,
  rememberJobTitle,
  resetPermOverrides,
  writePermOverride,
} from "@/lib/permMatrixStore";
import { toast } from "@/components/ui/use-toast";
import { MUTED, NAVY, NEUTRAL, OK, field, CARD, SURFACE } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";

/**
 * Platform settings — grantable permission matrix.
 * Owned by `/app/settings` (not Org).
 */

async function orgApi(payload) {
  const res = await base44.functions.invoke("org", payload);
  return res?.data ?? res;
}

const ROLE_LABEL = {
  ops_director: { ar: "مدير عمليات", en: "Ops Director" },
  station_manager: { ar: "مدير فرع", en: "Station Mgr" },
  supervisor: { ar: "مشرف", en: "Supervisor" },
  safety: { ar: "سلامة", en: "Safety" },
  employee: { ar: "موظف", en: "Employee" },
};

const SCOPE_LABEL = {
  [SCOPE.NONE]: { ar: "—", en: "—", fullAr: "لا صلاحية", fullEn: "No access" },
  [SCOPE.OWN]: { ar: "خاصته", en: "Own", fullAr: "سجلاته هو فقط", fullEn: "Own records only" },
  [SCOPE.STATION]: { ar: "فرعه", en: "Station", fullAr: "كل من في فرعه", fullEn: "Everyone at their station" },
  [SCOPE.REGION]: { ar: "منطقته", en: "Region", fullAr: "كل فروع منطقته", fullEn: "Every station in their region" },
  [SCOPE.COMPANY]: { ar: "كامل", en: "Company", fullAr: "الشركة كاملة", fullEn: "The whole company" },
};

function scopeChipStyle(scope) {
  if (scope === SCOPE.COMPANY) return OK;
  if (scope === SCOPE.STATION) {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 9px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      background: "#EFF6FF",
      color: "#1D4ED8",
      border: "1px solid #BFDBFE",
    };
  }
  if (scope === SCOPE.REGION) {
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 9px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      background: "#F5F3FF",
      color: "#6D28D9",
      border: "1px solid #DDD6FE",
    };
  }
  if (scope === SCOPE.OWN) return NEUTRAL;
  return { fontSize: "11px", color: MUTED };
}

const fieldInput = { ...field };

export default function SettingsPermDelegation({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const [matrix, setMatrix] = useState([]);
  const [titleCols, setTitleCols] = useState([]);
  const [removedTitles, setRemovedTitles] = useState([]);
  const [permDirty, setPermDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );

  const localTitles = collectJobTitles(data);

  const applyRemote = (remote) => {
    if (!remote) return;
    const blocked = (remote.removedTitles || []).map((item) => titleSlug(item)).filter(Boolean);
    setRemovedTitles(blocked);
    const live = collectJobTitles(data);
    const byId = new Map();
    for (const title of live) byId.set(title.id, { ...title });
    for (const item of remote.titles || []) {
      const label = typeof item === "string" ? item : item.label || item.id;
      const id = titleSlug(typeof item === "string" ? item : item.id || label);
      if (!id || (blocked.includes(id) && !byId.has(id))) continue;
      const prev = byId.get(id);
      byId.set(id, {
        id,
        label: label || prev?.label || id,
        count: Math.max(Number(item?.count) || 0, prev?.count || 0),
      });
    }
    const nextTitles = [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "ar"));
    setTitleCols(nextTitles);
    const rows = remote.matrix?.length
      ? remote.matrix
      : derivePermissionMatrix(remote.permOverrides || {}, nextTitles);
    const hasTitleCells = rows.some((row) => (row.cells || []).some((cell) => cell.titleKey || String(cell.roleId || "").startsWith("title:")));
    const nextRows = hasTitleCells ? rows : derivePermissionMatrix(remote.permOverrides || {}, nextTitles);
    const fallback = derivePermissionMatrix(remote.permOverrides || {}, nextTitles);
    const bySection = new Map(nextRows.map((row) => [row.sectionId, row]));
    setMatrix(ORG_SECTIONS.map((sectionId, si) => {
      const row = bySection.get(sectionId) || fallback[si] || { sectionId, cells: [] };
      return {
        ...row,
        sectionId,
        cells: (row.cells || []).map((cell) => ({
          ...cell,
          scope: grantableScope(cell.scope),
          derived: false,
        })),
      };
    }));
    setPermDirty(!!remote.permDirty);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await orgApi({ action: "list", companyId: company.id, titles: localTitles });
      if (remote && !remote.error) {
        applyRemote(remote);
        return;
      }
    } catch {
      /* org function may be unpublished — use the company snapshot */
    }
    applyRemote(readPermMatrix(data));
  };

  const titleKey = localTitles.map((t) => t.id).join("|");
  useEffect(() => { load(); }, [company?.id]);
  useEffect(() => {
    if (!localTitles.length && !titleCols.length) return;
    setTitleCols((prev) => {
      const blocked = new Set(removedTitles);
      const liveIds = new Set(localTitles.map((t) => t.id));
      const byId = new Map(prev.filter((t) => liveIds.has(t.id) || !blocked.has(t.id)).map((t) => [t.id, { ...t }]));
      let changed = prev.length !== byId.size;
      for (const title of localTitles) {
        const existing = byId.get(title.id);
        if (!existing) {
          byId.set(title.id, title);
          changed = true;
        } else if ((existing.count || 0) < title.count) {
          byId.set(title.id, { ...existing, count: title.count, label: existing.label || title.label });
          changed = true;
        }
      }
      for (const id of blocked) {
        if (!liveIds.has(id) && byId.delete(id)) changed = true;
      }
      return changed ? [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "ar")) : prev;
    });
  }, [titleKey, removedTitles.join("|")]);

  const applyLocalAction = (payload) => {
    if (payload.action === "setPerm") {
      return writePermOverride(company.id, {
        sectionIdx: payload.sectionIdx,
        roleIdx: payload.roleIdx,
        titleKey: payload.titleKey,
        scope: payload.scope,
        by: currentUser?.name,
      });
    }
    if (payload.action === "resetPerms") return resetPermOverrides(company.id);
    if (payload.action === "list" && Array.isArray(payload.titles)) {
      const added = payload.titles[payload.titles.length - 1];
      const label = typeof added === "string" ? added : added?.label;
      if (label) return rememberJobTitle(company.id, label);
    }
    if (payload.action === "removeTitle") return forgetJobTitleOverrides(company.id, payload.titleKey);
    return readPermMatrix(data);
  };

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    const local = applyLocalAction(payload);
    if (local?.error) {
      toast({
        description: ar ? (local.error.reason || local.error.error) : (local.error.reasonEn || local.error.reason || local.error.error),
        variant: "destructive",
      });
      setBusy(false);
      return;
    }
    applyRemote(local);
    refresh?.();
    try {
      const remote = await orgApi({ ...payload, companyId: company.id, titles: localTitles });
      if (remote && !remote.error) applyRemote(remote);
    } catch (err) {
      if (!isMissingRemote(err)) {
        toast({ description: String(err?.message || err), variant: "destructive" });
        setBusy(false);
        return;
      }
    }
    if (okMsg) toast({ description: okMsg });
    setBusy(false);
  };

  const setCellScope = (si, cell, ri, next) => {
    const gate = checkSetPermGate(next);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    run({
      action: "setPerm",
      sectionIdx: si,
      roleIdx: cell.titleKey ? undefined : (ORG_ROLES.indexOf(cell.roleId) >= 0 ? ORG_ROLES.indexOf(cell.roleId) : ri),
      titleKey: cell.titleKey || undefined,
      scope: next,
    }, ar ? "حُفظت الصلاحية." : "Permission saved.");
  };

  const addTitleColumn = () => {
    const label = newTitle.trim();
    if (!label) return;
    const gate = checkRemoveTitleGate(label);
    if (!gate.ok && gate.error === "SYSTEM_TITLE") {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    const id = titleSlug(label);
    if (titleCols.some((item) => item.id === id)) {
      toast({ description: ar ? "هذا المسمى موجود أصلًا في المصفوفة." : "That title is already a column." });
      return;
    }
    setTitleCols((prev) => [...prev, { id, label, count: 0 }].sort((a, b) => a.label.localeCompare(b.label, "ar")));
    setNewTitle("");
    run(
      { action: "list", titles: [...localTitles, { id, label, count: 0 }] },
      ar ? `أُضيف مسمى ${label}` : `Added ${label}`,
    );
  };

  const removeTitle = (title) => {
    const gate = checkRemoveTitleGate(title.label || title.id);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    const ok = window.confirm(
      ar
        ? `حذف مسمى «${title.label}» من المصفوفة ومن بطاقات الموظفين؟`
        : `Remove “${title.label}” from the matrix and from employee cards?`,
    );
    if (!ok) return;
    if (company?.id) removeCompanyJobTitle(company.id, title.label || title.id);
    setRemovedTitles((prev) => [...new Set([...prev, gate.id])]);
    setTitleCols((prev) => prev.filter((item) => item.id !== gate.id));
    run(
      {
        action: "removeTitle",
        titleKey: title.label || title.id,
        titles: localTitles.filter((item) => item.id !== gate.id),
      },
      ar ? `حُذف مسمى ${title.label}` : `Removed ${title.label}`,
    );
  };

  const columns = [
    ...ORG_ROLES.map((r) => ({ id: r, label: ar ? ROLE_LABEL[r].ar : ROLE_LABEL[r].en })),
    ...titleCols.map((t) => ({ id: `title:${t.id}`, label: t.label, count: t.count })),
  ];
  const colTemplate = `minmax(180px,1.4fr) repeat(${Math.max(columns.length, 5)},minmax(88px,1fr))`;

  return (
    <ChromeBox padded={false}>
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "مصفوفة الصلاحيات" : "Permission matrix"}</div>
        <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px" }}>
          {ar
            ? "اختر النطاق من القائمة في أي خانة — بما فيها الموارد البشرية والرواتب وإعدادات الشركة. أضف مسمى حرًا كعمود، أو امنح شخصًا بعينه من البطاقة أعلاه."
            : "Pick a scope from the list in any cell — including HR, payroll, and company settings. Add a free job title as a column, or grant a specific person from the card above."}
        </div>
        {isSenior ? (
          <form
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}
            onSubmit={(event) => {
              event.preventDefault();
              addTitleColumn();
            }}
          >
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={ar ? "مسمى جديد — مثل منسق الفرع" : "New title — e.g. branch coordinator"}
              style={{ ...fieldInput, maxWidth: 280 }}
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
              {ar ? "أضف عمود مسمى" : "Add title column"}
            </button>
          </form>
        ) : null}
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: `${Math.max(760, 220 + columns.length * 110)}px` }}>
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
            {columns.map((col) => (
              <div key={col.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  {col.label}
                  {col.count > 0 ? (
                    <span style={{ display: "block", fontWeight: 500, letterSpacing: 0, marginTop: 2 }}>
                      {ar ? `${col.count} موظف` : `${col.count} staff`}
                    </span>
                  ) : null}
                </div>
                {String(col.id).startsWith("title:") && isSenior ? (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={ar ? `حذف ${col.label}` : `Remove ${col.label}`}
                    onClick={() => removeTitle(titleCols.find((t) => `title:${t.id}` === col.id) || { id: col.id.replace(/^title:/, ""), label: col.label })}
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
            ))}
          </div>
          {(matrix.length ? matrix : ORG_SECTIONS.map((sectionId) => ({ sectionId, cells: [] }))).map((row, si) => (
            <div
              key={row.sectionId}
              style={{
                display: "grid",
                gridTemplateColumns: colTemplate,
                gap: "10px",
                padding: "11px 20px",
                borderBottom: "1px solid #F1F5F9",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "13px", color: NAVY }}>
                {ar ? ORG_SECTION_LABELS[row.sectionId]?.ar : ORG_SECTION_LABELS[row.sectionId]?.en}
              </div>
              {(() => {
                const cells = [...(row.cells || [])];
                const have = new Set(cells.map((c) => c.roleId));
                for (const title of titleCols) {
                  const id = `title:${title.id}`;
                  if (!have.has(id)) {
                    cells.push({ roleId: id, titleKey: title.label, ...effectiveTitleScope(si, title.id, {}) });
                  }
                }
                return cells.length ? cells : ORG_ROLES.map((roleId) => ({ roleId, scope: SCOPE.NONE, derived: false }));
              })().map((cell, ri) => {
                const scope = grantableScope(cell.scope);
                const lab = SCOPE_LABEL[scope] || SCOPE_LABEL[SCOPE.NONE];
                if (!isSenior) {
                  return (
                    <span
                      key={cell.roleId}
                      title={ar ? lab.fullAr : lab.fullEn}
                      style={{ opacity: busy ? 0.7 : 1 }}
                    >
                      <span style={scopeChipStyle(scope)}>{ar ? lab.ar : lab.en}</span>
                    </span>
                  );
                }
                return (
                  <select
                    key={cell.roleId}
                    disabled={busy}
                    title={ar ? lab.fullAr : lab.fullEn}
                    value={scope}
                    onChange={(event) => setCellScope(si, cell, ri, Number(event.target.value))}
                    style={{
                      ...scopeChipStyle(scope),
                      cursor: busy ? "wait" : "pointer",
                      height: 28,
                      padding: "0 8px",
                      fontFamily: "inherit",
                      appearance: "auto",
                    }}
                  >
                    {[SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY].map((optionScope) => {
                      const option = SCOPE_LABEL[optionScope];
                      return (
                        <option key={optionScope} value={optionScope}>
                          {ar ? option.ar : option.en} — {ar ? option.fullAr : option.fullEn}
                        </option>
                      );
                    })}
                  </select>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 20px 16px", borderTop: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[SCOPE.NONE, SCOPE.OWN, SCOPE.STATION, SCOPE.REGION, SCOPE.COMPANY].map((s) => {
            const lab = SCOPE_LABEL[s];
            return (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={scopeChipStyle(s)}>{ar ? lab.ar : lab.en}</span>
                <span style={{ fontSize: "11px", color: MUTED }}>{ar ? lab.fullAr : lab.fullEn}</span>
              </span>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 300px", fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>
            {ar
              ? "اختر النطاق مباشرة: لا صلاحية، خاصته، فرعه، منطقته، أو كامل الشركة. كل تغيير يُقيَّد باسمك ووقته."
              : "Pick the scope directly: none, own, station, region, or the whole company. Every change is recorded with your name and time."}
          </span>
          {permDirty && isSenior && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ action: "resetPerms" }, ar ? "أُعيدت المصفوفة إلى الأساس." : "Matrix reset to the baseline.")}
              style={{
                padding: "6px 13px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                background: CARD,
                color: MUTED,
                fontSize: "11px",
                cursor: busy ? "wait" : "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <RotateCcw style={{ width: 12, height: 12 }} />
              {ar ? "أعِد المصفوفة إلى الأساس" : "Reset to baseline"}
            </button>
          )}
        </div>
      </div>
    </ChromeBox>
  );
}
