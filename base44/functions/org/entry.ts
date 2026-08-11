import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  checkCreateBranchGate,
  checkCreateDelegationGate,
  checkReparentGate,
  checkSetPermGate,
  deriveDelegationStatus,
  deriveEscalationFromBranches,
  deriveOrgStats,
  derivePermissionMatrix,
  effectiveScope,
  nextScopeInCycle,
  permKey,
  type BranchLike,
  type DelegationLike,
  type OrgNodeLike,
  type PermOverride,
  type ScopeCode,
} from "../../shared/orgDerivations.ts";

const ORG_CATEGORY = "orgStructure";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type OrgPayload = {
  branches: Array<BranchLike & { companyId: string }>;
  treeNodes: Array<OrgNodeLike & { companyId?: string; type?: string; refId?: string }>;
  permOverrides: Record<string, PermOverride>;
  delegations: Array<DelegationLike & { companyId: string }>;
};

function emptyPayload(): OrgPayload {
  return { branches: [], treeNodes: [], permOverrides: {}, delegations: [] };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const action = String(body.action || "");
    const companyId = requireCompanyId(body.companyId);
    if (!companyId) {
      return Response.json({ error: "Missing companyId — record without tenant is rejected" }, { status: 400 });
    }

    const sessionAuth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!sessionAuth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const auth = {
      companyId,
      userId: sessionAuth.userId || null,
      name: sessionAuth.name || "User",
      role: sessionAuth.role || "employee",
      owner: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin,
      admin: !!sessionAuth.admin,
    };

    const seniorRoles = ["owner", "director", "ops_manager", "pgm", "admin"];
    const isSenior = auth.owner || auth.admin || seniorRoles.includes(auth.role);

    const loadBlob = async () => {
      const rows = await base44.asServiceRole.entities.CompanyDataBlob.filter({
        companyId: auth.companyId,
        category: ORG_CATEGORY,
      });
      return rows[0] || null;
    };

    const loadPayload = async (): Promise<OrgPayload> => {
      const blob = await loadBlob();
      const raw = blob?.payload && typeof blob.payload === "object" ? blob.payload : {};
      const base = emptyPayload();
      base.branches = (Array.isArray(raw.branches) ? raw.branches : []).filter(
        (b: BranchLike & { companyId?: string }) => b && b.companyId === auth.companyId && b.id,
      );
      base.treeNodes = (Array.isArray(raw.treeNodes) ? raw.treeNodes : []).filter(
        (n: OrgNodeLike & { companyId?: string }) => n && (!n.companyId || n.companyId === auth.companyId) && n.id,
      );
      const overrides: Record<string, PermOverride> = {};
      const rawOv = raw.permOverrides && typeof raw.permOverrides === "object" ? raw.permOverrides : {};
      for (const [k, v] of Object.entries(rawOv)) {
        if (v && typeof v === "object" && "scope" in (v as object)) overrides[k] = v as PermOverride;
        else if (typeof v === "number") overrides[k] = { key: k, scope: v as ScopeCode };
      }
      base.permOverrides = overrides;
      base.delegations = (Array.isArray(raw.delegations) ? raw.delegations : []).filter(
        (d: DelegationLike & { companyId?: string }) => d && d.companyId === auth.companyId && d.id,
      );
      return base;
    };

    const savePayload = async (payload: OrgPayload) => {
      const blob = await loadBlob();
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({
          companyId: auth.companyId,
          category: ORG_CATEGORY,
          payload,
        });
      }
    };

    const audit = async (actionKey: string, details: string, extra: Record<string, unknown> = {}) => {
      await base44.asServiceRole.entities.AuditLog.create({
        companyId: auth.companyId,
        action: actionKey,
        performedBy: auth.name,
        details,
        reason: extra.reason || null,
        oldValue: extra.oldValue || null,
        newValue: extra.newValue || null,
      });
    };

    const seedBranchesFromStations = async (data: OrgPayload) => {
      if (data.branches.length) return data;
      const stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
      data.branches = (stations || []).map((s: { stationId?: string; id?: string; name?: string; managerId?: string; location?: string }, i: number) => ({
        companyId: auth.companyId,
        id: s.stationId || s.id || `st_${i}`,
        name: s.name || `Station ${i + 1}`,
        region: i < 3 ? "west" : "east",
        managerId: s.managerId || null,
        managerName: null,
        crew: 0,
        seeded: true,
      }));
      return data;
    };

    const enrich = (data: OrgPayload, now = new Date()) => {
      const overrideMap: Record<string, ScopeCode> = {};
      for (const [k, v] of Object.entries(data.permOverrides)) overrideMap[k] = v.scope;
      const matrix = derivePermissionMatrix(overrideMap);
      const dirty = Object.keys(data.permOverrides).length > 0;
      const delegations = data.delegations.map((d) => ({
        ...d,
        ...deriveDelegationStatus(d, now),
      }));
      return {
        ok: true,
        branches: data.branches,
        treeNodes: data.treeNodes,
        matrix,
        permDirty: dirty,
        permOverrides: data.permOverrides,
        escalation: deriveEscalationFromBranches(data.branches),
        delegations,
        stats: deriveOrgStats(data.branches, data.delegations, now),
      };
    };

    if (action === "list") {
      let data = await loadPayload();
      data = await seedBranchesFromStations(data);
      if (!(await loadBlob()) && data.branches.length) await savePayload(data);
      return Response.json(enrich(data));
    }

    if (!isSenior) {
      return Response.json({ error: "Forbidden — senior role required to change org structure" }, { status: 403 });
    }

    if (action === "createBranch") {
      const gate = checkCreateBranchGate(body);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      const data = await seedBranchesFromStations(await loadPayload());
      const id = uid("br");
      const stationId = id;
      await base44.asServiceRole.entities.Station.create({
        companyId: auth.companyId,
        stationId,
        name: gate.name,
        location: body.region === "east" ? "Eastern region" : "Western region",
        type: "branch",
        status: "active",
        managerId: body.managerId || null,
      });
      const branch: BranchLike & { companyId: string } = {
        companyId: auth.companyId,
        id: stationId,
        name: gate.name,
        region: body.region === "east" ? "east" : "west",
        managerId: body.managerId || null,
        managerName: body.managerName || gate.manager,
        crew: Math.max(1, Number(body.crew) || 12),
        seeded: false,
      };
      data.branches = [...data.branches, branch];
      data.treeNodes = [
        ...data.treeNodes,
        { id: `org_station_${stationId}`, parentId: null, companyId: auth.companyId, type: "station", refId: stationId },
      ];
      await savePayload(data);
      await audit("org.createBranch", `Created branch ${gate.name}`, { newValue: stationId });
      return Response.json({ ok: true, branch, ...enrich(data) });
    }

    if (action === "setBranchManager") {
      const branchId = String(body.branchId || "");
      const managerId = body.managerId != null ? String(body.managerId) : null;
      const managerName = body.managerName != null ? String(body.managerName) : null;
      if (!branchId || !(managerId || managerName)) {
        return Response.json({ error: "MANAGER_REQUIRED", reason: "المسؤول مطلوب." }, { status: 400 });
      }
      const data = await seedBranchesFromStations(await loadPayload());
      const idx = data.branches.findIndex((b) => b.id === branchId);
      if (idx < 0) return Response.json({ error: "BRANCH_NOT_FOUND" }, { status: 404 });
      const prev = data.branches[idx];
      data.branches[idx] = {
        ...prev,
        managerId,
        managerName: managerName || managerId,
      };
      try {
        const stations = await base44.asServiceRole.entities.Station.filter({ companyId: auth.companyId });
        const st = (stations || []).find((s: { stationId?: string; id?: string }) => (s.stationId || s.id) === branchId);
        if (st?.id) {
          await base44.asServiceRole.entities.Station.update(st.id, { managerId });
        }
      } catch {
        // Station sync best-effort — blob remains source for escalation derivation
      }
      await savePayload(data);
      await audit(
        "org.setBranchManager",
        `Branch ${prev.name} manager → ${managerName || managerId} — permissions and escalation moved immediately`,
        { oldValue: prev.managerId || prev.managerName, newValue: managerId || managerName },
      );
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "reparent") {
      const nodeId = String(body.nodeId || "");
      const newParentId = body.parentId == null || body.parentId === "" ? null : String(body.parentId);
      const data = await loadPayload();
      const gate = checkReparentGate(data.treeNodes, nodeId, newParentId);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      data.treeNodes = data.treeNodes.map((n) => (n.id === nodeId ? { ...n, parentId: newParentId } : n));
      await savePayload(data);
      await audit("org.reparent", `Reparented ${nodeId} under ${newParentId || "root"}`);
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "setPerm") {
      const sectionIdx = Number(body.sectionIdx);
      const roleIdx = Number(body.roleIdx);
      const data = await loadPayload();
      const overrideMap: Record<string, ScopeCode> = {};
      for (const [k, v] of Object.entries(data.permOverrides)) overrideMap[k] = v.scope;
      const current = effectiveScope(sectionIdx, roleIdx, overrideMap);
      if (current.derived) {
        return Response.json({
          error: "DELEGATED_IS_DERIVED",
          reason: "«بتفويض» حالة مشتقة من سجل التفويض — لا تُضبط من المصفوفة.",
          reasonEn: "\"Delegated\" is derived from the delegation register — not set from the matrix.",
        }, { status: 400 });
      }
      const next = body.scope != null ? Number(body.scope) : nextScopeInCycle(current.scope);
      const gate = checkSetPermGate(next);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      const key = permKey(sectionIdx, roleIdx);
      data.permOverrides[key] = {
        key,
        scope: gate.scope,
        by: auth.name,
        at: new Date().toISOString(),
      };
      await savePayload(data);
      await audit("org.setPerm", `Perm ${key} → ${gate.scope}`, {
        oldValue: String(current.scope),
        newValue: String(gate.scope),
      });
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "resetPerms") {
      const data = await loadPayload();
      data.permOverrides = {};
      await savePayload(data);
      await audit("org.resetPerms", "Permission matrix reset to structure-derived baseline");
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "createDelegation") {
      const gate = checkCreateDelegationGate(body);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      const data = await loadPayload();
      const rec: DelegationLike & { companyId: string } = {
        companyId: auth.companyId,
        id: uid("dg"),
        fromId: String(body.fromId),
        toId: String(body.toId),
        perm: String(body.perm).trim(),
        reason: String(body.reason || "").trim() || null,
        end: String(body.end),
        revoked: false,
      };
      data.delegations = [rec, ...data.delegations];
      await savePayload(data);
      await audit("org.createDelegation", `Delegated ${rec.perm} to ${rec.toId} until ${rec.end}`);
      return Response.json({ ok: true, delegation: rec, ...enrich(data) });
    }

    if (action === "revokeDelegation") {
      const id = String(body.id || "");
      const data = await loadPayload();
      const idx = data.delegations.findIndex((d) => d.id === id);
      if (idx < 0) return Response.json({ error: "DELEGATION_NOT_FOUND" }, { status: 404 });
      data.delegations[idx] = { ...data.delegations[idx], revoked: true };
      await savePayload(data);
      await audit("org.revokeDelegation", `Revoked delegation ${id}`);
      return Response.json({ ok: true, ...enrich(data) });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: String((err as Error)?.message || err) }, { status: 500 });
  }
});
