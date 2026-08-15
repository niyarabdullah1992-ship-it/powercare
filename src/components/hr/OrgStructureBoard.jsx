import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { toast } from "@/components/ui/use-toast";
import { ensureOrgStationNode, saveOrgStationName, setOrgStationManager } from "@/lib/orgTree";
import { deriveBranchEscalationChain, escalationStationsForEmployee, sharedEscalationLabel } from "@/lib/orgDerivations";
import EscalationCoverageDialog from "@/components/hr/EscalationCoverageDialog";
import { updateCompany } from "@/lib/store";
import { MUTED, NAVY, pageCol, field, CARD, SURFACE } from "@/lib/platformStyles";
import { ChromeBox } from "@/components/shared/IdentityCard";
import useStationScope from "@/hooks/useStationScope";

async function orgApi(payload) {
  const res = await base44.functions.invoke("org", payload);
  return res?.data ?? res;
}

const fieldInput = { ...field };

const selStyle = {
  ...field,
  width: "auto",
  height: "36px",
  padding: "0 10px",
  fontSize: "11px",
  maxWidth: "190px",
};

const branchRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 0",
  borderTop: "1px solid #F1F5F9",
  flexWrap: "wrap",
};

/** Branch admin only — people hierarchy lives in FlexOrgTree (primary). */
export default function OrgStructureBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [brOpen, setBrOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", managerId: "", crew: 12 });
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [escalationEdit, setEscalationEdit] = useState(null);

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );

  const employees = data?.employees || [];
  const headerScope = useStationScope();
  const scopedStationId = headerScope && headerScope !== "all" ? String(headerScope) : null;
  const visibleBranches = useMemo(
    () => (scopedStationId ? branches.filter((b) => String(b.id) === scopedStationId) : branches),
    [branches, scopedStationId],
  );
  const empName = (id) => employees.find((e) => e.id === id)?.name || id || "—";
  const branchChains = useMemo(() => {
    const list = (visibleBranches.length ? visibleBranches : (data?.stations || []).map((s) => ({
      id: s.id || s.stationId,
      name: s.name,
    }))).filter((b) => !scopedStationId || String(b.id) === scopedStationId);
    return list.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      steps: deriveBranchEscalationChain(b.id, data),
    })).filter((row) => row.steps.length > 0);
  }, [visibleBranches, data, scopedStationId]);

  const fromStations = () => {
    const stations = data?.stations || [];
    return stations.map((s, i) => {
      const id = s.stationId || s.id || `st_${i}`;
      return {
        id,
        name: s.name || `Station ${i + 1}`,
        managerId: s.managerId || null,
        managerName: employees.find((e) => e.id === s.managerId)?.name || null,
        crew: (data?.employees || []).filter((e) => e.stationId === id).length || 0,
      };
    });
  };

  const applyRemote = (remote) => {
    if (!remote) return;
    setBranches(remote.branches || []);
    setStats(remote.stats || null);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await orgApi({ action: "list", companyId: company.id });
      applyRemote(remote);
    } catch {
      setBranches(fromStations());
    }
  };

  useEffect(() => { load(); }, [company?.id, data?.stations]);

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
        if (payload.action === "renameBranch" && payload.branchId && payload.name) {
          saveOrgStationName(company.id, payload.branchId, payload.name);
        } else if (payload.action === "setBranchManager" && payload.branchId) {
          setOrgStationManager(company.id, payload.branchId, payload.managerId);
        } else if (payload.action === "createBranch") {
          const created = remote?.branch;
          if (created?.id) ensureOrgStationNode(company.id, created);
        }
        applyRemote(remote);
      }
    } catch (err) {
      // Local preview fallback for rename / manager
      if (payload.action === "renameBranch" && payload.branchId && payload.name) {
        saveOrgStationName(company.id, payload.branchId, payload.name);
        updateCompany(company.id, (d) => {
          const st = (d.stations || []).find((s) => (s.stationId || s.id) === payload.branchId);
          if (st) st.name = payload.name;
        });
        setBranches((prev) => prev.map((b) => (b.id === payload.branchId ? { ...b, name: payload.name } : b)));
        if (okMsg) toast({ description: okMsg });
      } else if (payload.action === "setBranchManager" && payload.branchId) {
        setOrgStationManager(company.id, payload.branchId, payload.managerId);
        setBranches((prev) => prev.map((b) => (
          b.id === payload.branchId
            ? { ...b, managerId: payload.managerId, managerName: payload.managerName }
            : b
        )));
        if (okMsg) toast({ description: okMsg });
      } else if (payload.action === "createBranch" && payload.name) {
        const id = `br_${Date.now().toString(36)}`;
        updateCompany(company.id, (d) => {
          d.stations = [...(d.stations || []), {
            id,
            stationId: id,
            name: payload.name,
            managerId: payload.managerId || null,
            type: "branch",
            status: "active",
          }];
        });
        ensureOrgStationNode(company.id, { id, name: payload.name });
        setBranches((prev) => [...prev, {
          id,
          name: payload.name,
          managerId: payload.managerId || null,
          managerName: payload.managerName || null,
          crew: Number(payload.crew) || 12,
        }]);
        if (okMsg) toast({ description: okMsg });
      } else {
        toast({ description: String(err?.message || err), variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const brReady = String(branchForm.name || "").trim() && branchForm.managerId;
  const brCreateStyle = brReady
    ? {
      height: "36px",
      padding: "0 16px",
      borderRadius: "9px",
      border: "none",
      background: "#1E9E63",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 600,
      cursor: busy ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: busy ? 0.6 : 1,
    }
    : {
      height: "36px",
      padding: "0 16px",
      borderRadius: "9px",
      border: "none",
      background: "#E2E8F0",
      color: MUTED,
      fontSize: "12px",
      fontWeight: 600,
      cursor: "not-allowed",
      fontFamily: "inherit",
    };

  const commitRename = (branch) => {
    const name = String(renameValue || "").trim();
    if (!name || name === branch.name) {
      setRenamingId(null);
      return;
    }
    run(
      { action: "renameBranch", branchId: branch.id, name },
      ar ? `أُعيد تسمية الفرع إلى «${name}»` : `Branch renamed to «${name}»`,
    );
    setRenamingId(null);
  };

  return (
    <section style={{ ...pageCol, margin: 0, maxWidth: "none" }} dir={ar ? "rtl" : "ltr"}>
      <ChromeBox>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {ar ? "الفروع بالمسمى" : "Branches by name"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.7, maxWidth: "820px" }}>
              {ar
                ? "اسم الفرع فقط — بدون منطقة مفروضة. أعد التسمية أو غيّر المسؤول في أي وقت."
                : "Branch name only — no forced region. Rename or change the manager anytime."}
            </div>
          </div>
          {stats && (
            <span style={{ fontSize: "11px", color: MUTED }}>
              {stats.branches} {ar ? "فروع" : "branches"}
              {stats.unassignedManagers > 0 ? (
                <span style={{ color: "#B45309" }}>
                  {` · ${stats.unassignedManagers} ${ar ? "بلا مسؤول" : "without manager"}`}
                </span>
              ) : null}
            </span>
          )}
          {isSenior && (
            <button
              type="button"
              onClick={() => setBrOpen((v) => !v)}
              style={{
                padding: "8px 15px",
                borderRadius: "9px",
                border: "none",
                background: "#1E9E63",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {ar ? "+ أنشئ فرعًا جديدًا" : "+ Create a branch"}
            </button>
          )}
        </div>

        {isSenior && brOpen && (
          <div style={{ marginTop: "14px", padding: "15px 16px", borderRadius: "12px", background: SURFACE, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "11px" }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "اسم الفرع" : "Branch name"}
                </span>
                <input
                  required
                  placeholder={ar ? "مثال: فرع الخفجي · منصة رابغ · أي اسم حر" : "e.g. Khafji Branch · Rabigh Platform · any free name"}
                  value={branchForm.name}
                  onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
                  style={fieldInput}
                />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "مسؤول الفرع" : "Branch manager"}
                </span>
                <select
                  required
                  value={branchForm.managerId}
                  onChange={(e) => setBranchForm((f) => ({ ...f, managerId: e.target.value }))}
                  style={fieldInput}
                >
                  <option value="">{ar ? "اختر المسؤول" : "Select a manager"}</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "عدد الطاقم" : "Crew size"}
                </span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={branchForm.crew}
                  onChange={(e) => setBranchForm((f) => ({ ...f, crew: e.target.value }))}
                  style={fieldInput}
                />
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "13px", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 240px", fontSize: "11px", color: MUTED, lineHeight: 1.7 }}>
                {ar
                  ? "يظهر الفرع فورًا في الشجرة والصلاحيات والورديات — مشتق من اسمه لا من منطقة ثابتة."
                  : "The branch appears at once in the tree, permissions and rotas — derived from its name, not a fixed region."}
              </span>
              <button
                type="button"
                onClick={() => { setBrOpen(false); setBranchForm({ name: "", managerId: "", crew: 12 }); }}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  borderRadius: "9px",
                  border: "1px solid #E2E8F0",
                  background: CARD,
                  color: MUTED,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!brReady || busy}
                style={brCreateStyle}
                onClick={() => {
                  if (!brReady) return;
                  const mgr = employees.find((x) => x.id === branchForm.managerId);
                  run(
                    {
                      action: "createBranch",
                      name: branchForm.name.trim(),
                      managerId: branchForm.managerId,
                      managerName: mgr?.name,
                      crew: branchForm.crew,
                    },
                    ar ? `أُنشئ فرع «${branchForm.name.trim()}»` : `Branch «${branchForm.name.trim()}» created`,
                  );
                  setBranchForm({ name: "", managerId: "", crew: 12 });
                  setBrOpen(false);
                }}
              >
                {busy ? <Loader2 style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle" }} className="animate-spin" /> : null}
                {" "}{ar ? "أنشئ الفرع" : "Create the branch"}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: "6px" }}>
          {visibleBranches.map((b) => (
            <div key={b.id} style={branchRowStyle}>
              <span style={{ flex: "1 1 180px", minWidth: 0 }}>
                {renamingId === b.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(b)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitRename(b); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    style={{ ...fieldInput, maxWidth: 280 }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSenior) return;
                      setRenamingId(b.id);
                      setRenameValue(b.name);
                    }}
                    style={{
                      display: "block",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: NAVY,
                      cursor: isSenior ? "text" : "default",
                      fontFamily: "inherit",
                      textAlign: "inherit",
                    }}
                    title={isSenior ? (ar ? "اضغط لإعادة التسمية" : "Click to rename") : undefined}
                  >
                    {b.name}
                  </button>
                )}
                <span style={{ display: "block", fontSize: "11px", color: MUTED, marginTop: "2px" }}>
                  {ar ? `${b.crew || 0} موظفًا` : `${b.crew || 0} employees`}
                  {" · "}
                  {ar ? "المسؤول" : "Manager"}
                  {": "}
                  {b.managerName || empName(b.managerId) || "—"}
                </span>
              </span>
              {isSenior && (
                <select
                  defaultValue=""
                  style={selStyle}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const mgr = employees.find((x) => x.id === id);
                    run(
                      { action: "setBranchManager", branchId: b.id, managerId: id, managerName: mgr?.name },
                      ar
                        ? `أُسند ${b.name} — انتقلت الصلاحيات والتصعيد فورًا`
                        : `${b.name} reassigned — permissions and escalation moved immediately`,
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
          {branches.length === 0 && (
            <div style={{ padding: "22px 0 6px", textAlign: "center", fontSize: "13px", color: MUTED }}>
              {ar ? "لا فروع بعد." : "No branches yet."}
            </div>
          )}
        </div>

        {branchChains.length > 0 && (
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #E2E8F0" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "8px" }}>
              {ar ? "تصعيد كل فرع — اضغط الاسم لتحديد كم فرعًا يمسك رقمه" : "Each branch path — tap a name to set how many branches that rank holds"}
            </div>
            {branchChains.map((row) => (
              <div key={row.branchId} style={{ fontSize: "11px", color: MUTED, padding: "6px 0", lineHeight: 1.65 }}>
                <span style={{ fontWeight: 600, color: NAVY }}>{row.branchName}</span>
                {" · "}
                {row.steps.map((s, idx) => {
                  const name = s.name || s.title;
                  if (!name) return null;
                  const shared = sharedEscalationLabel(escalationStationsForEmployee(s.employeeId, data).length, ar, idx + 1);
                  const label = shared || (ar ? `تصعيد ${idx + 1}` : `Escalation ${idx + 1}`);
                  return (
                    <span key={`${row.branchId}-${s.employeeId}-${idx}`}>
                      {idx > 0 ? (ar ? " ثم " : " → ") : null}
                      <button
                        type="button"
                        disabled={!isSenior}
                        onClick={() => setEscalationEdit({
                          employeeId: s.employeeId,
                          stationId: row.branchId,
                          level: idx + 1,
                        })}
                        style={{
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          color: NAVY,
                          fontWeight: 600,
                          fontSize: "11px",
                          cursor: isSenior ? "pointer" : "default",
                          fontFamily: "inherit",
                        }}
                      >
                        {name}
                      </button>
                      {` (${label})`}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ChromeBox>

      <ChromeBox
        style={{
          marginTop: "12px",
        }}
        bodyStyle={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
            {ar ? "الصلاحيات والتفويض" : "Permissions & delegation"}
          </div>
          <div style={{ fontSize: "11px", color: MUTED, marginTop: "3px", lineHeight: 1.6 }}>
            {ar
              ? "تُدار من إعدادات الشركة — مشتقة من هذا الهيكل."
              : "Managed in company settings — derived from this structure."}
          </div>
        </div>
        <Link
          to="/app/settings"
          style={{
            padding: "7px 14px",
            borderRadius: "9px",
            border: "1px solid #1E9E63",
            background: CARD,
            color: "#14683F",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          {ar ? "افتح في الإعدادات" : "Open in settings"}
        </Link>
      </ChromeBox>

      {escalationEdit && (
        <EscalationCoverageDialog
          employeeId={escalationEdit.employeeId}
          stationId={escalationEdit.stationId}
          level={escalationEdit.level}
          data={data}
          companyId={company.id}
          ar={ar}
          onClose={() => setEscalationEdit(null)}
        />
      )}
    </section>
  );
}
