import React, { useEffect, useState } from "react";
import { Loader2, Network, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  ORG_ROLES,
  ORG_SECTIONS,
  SCOPE,
  checkSetPermGate,
  nextScopeInCycle,
} from "@/lib/orgDerivations";
import { toast } from "@/components/ui/use-toast";

async function orgApi(payload) {
  const res = await base44.functions.invoke("org", payload);
  return res?.data ?? res;
}

const SECTION_LABEL = {
  command: { ar: "مركز القيادة", en: "Command Center" },
  operations: { ar: "المهام والعمليات", en: "Operations" },
  attendance: { ar: "الحضور", en: "Attendance" },
  daily: { ar: "التقرير اليومي", en: "Daily report" },
  hse: { ar: "السلامة HSE", en: "Safety HSE" },
  complaints: { ar: "الشكاوى المجهولة", en: "Anonymous reports" },
  leave: { ar: "طلبات الإجازة", en: "Leave requests" },
  hr: { ar: "الموارد البشرية", en: "Human Resources" },
  payroll: { ar: "الرواتب", en: "Payroll" },
  settings: { ar: "إعدادات الشركة", en: "Company settings" },
};

const ROLE_LABEL = {
  ops_director: { ar: "مدير عمليات", en: "Ops Director" },
  station_manager: { ar: "مدير محطة", en: "Station Mgr" },
  supervisor: { ar: "مشرف", en: "Supervisor" },
  safety: { ar: "سلامة", en: "Safety" },
  employee: { ar: "موظف", en: "Employee" },
};

const SCOPE_LABEL = {
  [SCOPE.NONE]: { ar: "—", en: "—", fullAr: "لا صلاحية", fullEn: "No access" },
  [SCOPE.OWN]: { ar: "خاصته", en: "Own", fullAr: "سجلاته هو فقط", fullEn: "Own records only" },
  [SCOPE.STATION]: { ar: "محطته", en: "Station", fullAr: "كل من في محطته", fullEn: "Everyone at their station" },
  [SCOPE.REGION]: { ar: "منطقته", en: "Region", fullAr: "كل محطات منطقته", fullEn: "Every station in their region" },
  [SCOPE.COMPANY]: { ar: "كامل", en: "Company", fullAr: "الشركة كاملة", fullEn: "The whole company" },
  [SCOPE.DELEGATED]: { ar: "بتفويض", en: "Delegated", fullAr: "مشتقة من سجل التفويض", fullEn: "Derived from the delegation register" },
};

function scopeChipClass(scope) {
  if (scope === SCOPE.COMPANY) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (scope === SCOPE.STATION) return "border-blue-200 bg-blue-50 text-blue-800";
  if (scope === SCOPE.REGION) return "border-violet-200 bg-violet-50 text-violet-800";
  if (scope === SCOPE.DELEGATED) return "border-amber-200 bg-amber-50 text-amber-900";
  if (scope === SCOPE.OWN) return "border-border bg-muted text-foreground";
  return "border-transparent text-muted-foreground";
}

export default function OrgStructureBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [branches, setBranches] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [escalation, setEscalation] = useState([]);
  const [stats, setStats] = useState(null);
  const [permDirty, setPermDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", managerId: "", region: "west", crew: 12 });
  const [dgForm, setDgForm] = useState({ fromId: "", toId: "", perm: ar ? "اعتماد المهام" : "Task approval", end: "", reason: "" });

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );

  const employees = data?.employees || [];
  const empName = (id) => employees.find((e) => e.id === id)?.name || id || "—";

  const applyRemote = (remote) => {
    if (!remote) return;
    setBranches(remote.branches || []);
    setMatrix(remote.matrix || []);
    setDelegations(remote.delegations || []);
    setEscalation(remote.escalation || []);
    setStats(remote.stats || null);
    setPermDirty(!!remote.permDirty);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await orgApi({ action: "list", companyId: company.id });
      applyRemote(remote);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await orgApi({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const cycleCell = (si, cell, ri) => {
    if (cell.derived) {
      toast({
        description: ar
          ? "«بتفويض» حالة مشتقة من سجل التفويض — لا تُضبط من المصفوفة."
          : "\"Delegated\" is derived — manage it in the temporary delegation register.",
        variant: "destructive",
      });
      return;
    }
    const next = nextScopeInCycle(cell.scope);
    const gate = checkSetPermGate(next);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    run({ action: "setPerm", sectionIdx: si, roleIdx: ri, scope: next });
  };

  return (
    <section className="space-y-5 rounded-xl border bg-card p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2"><Network className="h-5 w-5 text-accent" /></span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{ar ? "الهيكل والصلاحيات" : "Structure & permissions"}</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {ar
                ? "الصلاحيات وسلسلة التصعيد تُشتقان من الهيكل — تغيير المسؤول ينقلهما فورًا. «بتفويض» مشتقة من سجل التفويض ولا تُضبط من المصفوفة."
                : "Permissions and escalation derive from the structure — changing a manager moves both immediately. \"Delegated\" comes from the delegation register, not the matrix."}
            </p>
          </div>
        </div>
        {stats && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{stats.branches} {ar ? "فروع" : "branches"}</span>
            <span>{stats.activeDelegations} {ar ? "تفويضات سارية" : "active delegations"}</span>
            {stats.unassignedManagers > 0 && (
              <span className="text-amber-700">{stats.unassignedManagers} {ar ? "بلا مسؤول" : "without manager"}</span>
            )}
          </div>
        )}
      </div>

      {isSenior && (
        <form
          className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const mgr = employees.find((x) => x.id === branchForm.managerId);
            run(
              {
                action: "createBranch",
                name: branchForm.name,
                managerId: branchForm.managerId,
                managerName: mgr?.name,
                region: branchForm.region,
                crew: branchForm.crew,
              },
              ar ? `أُنشئ فرع «${branchForm.name}»` : `Branch «${branchForm.name}» created`,
            );
            setBranchForm((f) => ({ ...f, name: "" }));
          }}
        >
          <label className="grid gap-1 text-[11px]">
            <span>{ar ? "اسم الفرع" : "Branch name"}</span>
            <input required className="h-8 rounded-md border bg-background px-2 text-sm" value={branchForm.name} onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-[11px]">
            <span>{ar ? "مسؤول الفرع" : "Manager"}</span>
            <select required className="h-8 rounded-md border bg-background px-2 text-sm" value={branchForm.managerId} onChange={(e) => setBranchForm((f) => ({ ...f, managerId: e.target.value }))}>
              <option value="">{ar ? "اختر…" : "Select…"}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[11px]">
            <span>{ar ? "المنطقة" : "Region"}</span>
            <select className="h-8 rounded-md border bg-background px-2 text-sm" value={branchForm.region} onChange={(e) => setBranchForm((f) => ({ ...f, region: e.target.value }))}>
              <option value="west">{ar ? "غربية" : "West"}</option>
              <option value="east">{ar ? "شرقية" : "East"}</option>
            </select>
          </label>
          <button type="submit" disabled={busy} className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {ar ? "أنشئ الفرع" : "Create branch"}
          </button>
        </form>
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{ar ? "إدارة الفروع والمناصب" : "Branches and postings"}</h3>
        {branches.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-2 border-t py-2 text-xs">
            <div className="min-w-[10rem] flex-1">
              <div className="font-medium">{b.name}</div>
              <div className="text-muted-foreground">
                {b.crew ? `${b.crew} ${ar ? "موظفًا" : "crew"} · ` : ""}
                {ar ? "المسؤول" : "Manager"}: {b.managerName || empName(b.managerId) || "—"}
              </div>
            </div>
            {isSenior && (
              <select
                className="h-8 max-w-[12rem] rounded-md border bg-background px-2"
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const mgr = employees.find((x) => x.id === id);
                  run(
                    { action: "setBranchManager", branchId: b.id, managerId: id, managerName: mgr?.name },
                    ar ? `أُسند ${b.name} — انتقلت الصلاحيات والتصعيد فورًا` : `${b.name} reassigned — permissions and escalation moved immediately`,
                  );
                  e.target.value = "";
                }}
              >
                <option value="">{ar ? "غيّر المسؤول" : "Change manager"}</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {escalation.length > 0 && (
        <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
          <h3 className="text-xs font-semibold">{ar ? "سلسلة التصعيد المشتقة" : "Derived escalation chain"}</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {escalation.map((h) => (
              <li key={h.branchId}>{h.branchName} → {h.managerName || empName(h.managerId)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{ar ? "مصفوفة الصلاحيات" : "Permission matrix"}</h3>
            <p className="text-[11px] text-muted-foreground">
              {ar ? "اضغط خانة لترفع النطاق أو تخفضه. كل استثناء مقيَّد باسمك." : "Click a cell to raise or lower scope. Every exception is recorded with your name."}
            </p>
          </div>
          {permDirty && isSenior && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ action: "resetPerms" }, ar ? "أُعيدت المصفوفة إلى المشتقّة من الهيكل." : "Matrix reset to structure-derived baseline.")}
              className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {ar ? "أعِد للمشتق" : "Reset to derived"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="border-b p-2 text-start font-medium text-muted-foreground">{ar ? "القسم" : "Section"}</th>
                {ORG_ROLES.map((r) => (
                  <th key={r} className="border-b p-2 text-start font-medium">{ar ? ROLE_LABEL[r].ar : ROLE_LABEL[r].en}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(matrix.length ? matrix : ORG_SECTIONS.map((sectionId) => ({ sectionId, cells: [] }))).map((row, si) => (
                <tr key={row.sectionId}>
                  <td className="border-b p-2 font-medium">{ar ? SECTION_LABEL[row.sectionId]?.ar : SECTION_LABEL[row.sectionId]?.en}</td>
                  {(row.cells.length ? row.cells : ORG_ROLES.map((roleId) => ({ roleId, scope: SCOPE.NONE, derived: false }))).map((cell, ri) => {
                    const lab = SCOPE_LABEL[cell.scope] || SCOPE_LABEL[SCOPE.NONE];
                    return (
                      <td key={cell.roleId} className="border-b p-1.5">
                        <button
                          type="button"
                          disabled={!isSenior || busy}
                          title={ar ? lab.fullAr : lab.fullEn}
                          onClick={() => cycleCell(si, cell, ri)}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold disabled:cursor-not-allowed ${scopeChipClass(cell.scope)} ${cell.derived ? "cursor-not-allowed opacity-80" : ""}`}
                        >
                          {ar ? lab.ar : lab.en}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{ar ? "التفويض المؤقت" : "Temporary delegation"}</h3>
        <p className="text-[11px] text-muted-foreground">
          {ar
            ? "الصلاحية المفوَّضة تنتهي بنفسها في تاريخها — المفوِّض يبقى مسؤولًا."
            : "A delegated permission expires on its own date — the delegator stays accountable."}
        </p>
        {isSenior && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run({ action: "createDelegation", ...dgForm }, ar ? "فُوّضت صلاحية مؤقتة." : "Temporary delegation created.");
            }}
          >
            <select required className="h-8 rounded-md border bg-background px-2 text-xs" value={dgForm.fromId} onChange={(e) => setDgForm((f) => ({ ...f, fromId: e.target.value }))}>
              <option value="">{ar ? "من" : "From"}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select required className="h-8 rounded-md border bg-background px-2 text-xs" value={dgForm.toId} onChange={(e) => setDgForm((f) => ({ ...f, toId: e.target.value }))}>
              <option value="">{ar ? "إلى" : "To"}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input required type="date" className="h-8 rounded-md border bg-background px-2 text-xs" value={dgForm.end} onChange={(e) => setDgForm((f) => ({ ...f, end: e.target.value }))} />
            <input className="h-8 w-36 rounded-md border bg-background px-2 text-xs" value={dgForm.perm} onChange={(e) => setDgForm((f) => ({ ...f, perm: e.target.value }))} />
            <button type="submit" disabled={busy} className="h-8 rounded-md border px-3 text-xs font-medium">{ar ? "+ فوّض" : "+ Delegate"}</button>
          </form>
        )}
        {delegations.filter((d) => !d.revoked).length === 0 && (
          <p className="text-xs text-muted-foreground">{ar ? "لا تفويضات سارية." : "No active delegations."}</p>
        )}
        {delegations.filter((d) => !d.revoked).map((d) => (
          <div key={d.id} className={`flex flex-wrap items-center gap-2 border-t py-2 text-xs ${d.expired ? "opacity-60" : ""}`}>
            <span className="font-medium">{d.perm}</span>
            <span className="text-muted-foreground">{empName(d.fromId)} → {empName(d.toId)} · {d.end}</span>
            <span className={`rounded-full border px-2 py-0.5 ${d.expired ? "" : d.daysLeft <= 2 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {d.expired
                ? (ar ? "انتهت — سُحبت تلقائيًا" : "Expired — withdrawn automatically")
                : (ar ? `تبقّى ${d.daysLeft} يومًا` : `${d.daysLeft} days left`)}
            </span>
            {isSenior && !d.expired && (
              <button type="button" disabled={busy} className="rounded border px-2 py-0.5" onClick={() => run({ action: "revokeDelegation", id: d.id })}>
                {ar ? "اسحب الآن" : "Revoke now"}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
