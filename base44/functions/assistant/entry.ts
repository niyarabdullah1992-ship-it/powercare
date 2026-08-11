import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  AI_FEATURE,
  ASSISTANT_SECTION,
  buildAssistantBoard,
  checkAskGate,
  demoAssistantFacts,
  type AssistantActor,
  type AssistantFacts,
  type AssistantPromptId,
  type PlanLike,
} from "../../shared/assistantDerivations.ts";

const ASSISTANT_CATEGORY = "assistantFacts";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

function normalizePlan(raw: unknown): PlanLike | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    enabledSections: Array.isArray(o.enabledSections)
      ? o.enabledSections.filter((x): x is string => typeof x === "string")
      : undefined,
    enabledFeatures: Array.isArray(o.enabledFeatures)
      ? o.enabledFeatures.filter((x): x is string => typeof x === "string")
      : undefined,
  };
}

function emptyFacts(companyId: string): AssistantFacts {
  return {
    companyId,
    stations: [],
    hazards: [],
    assets: [],
    blockedTasks: [],
  };
}

function filterFacts(raw: AssistantFacts, companyId: string): AssistantFacts {
  return {
    ...raw,
    companyId,
    stations: (raw.stations || []).filter((s) => s && s.id && (!s.companyId || s.companyId === companyId)),
    hazards: (raw.hazards || []).filter((h) => h && h.id && (!h.companyId || h.companyId === companyId)),
    assets: (raw.assets || []).filter((a) => a && a.id && (!a.companyId || a.companyId === companyId)),
    blockedTasks: (raw.blockedTasks || []).filter((t) => t && t.id && (!t.companyId || t.companyId === companyId)),
    budgetPctByStation: raw.budgetPctByStation && typeof raw.budgetPctByStation === "object"
      ? raw.budgetPctByStation
      : {},
  };
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

    const auth: AssistantActor & {
      companyId: string;
      userId: string | null;
      name: string;
    } = {
      companyId,
      userId: sessionAuth.userId || null,
      name: sessionAuth.name || "User",
      role: sessionAuth.role || "employee",
      stationId: sessionAuth.stationId || null,
      owner: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin,
      admin: !!sessionAuth.admin,
      allStations: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin
        || ["director", "ops_manager", "pgm", "hr_manager", "hr"].includes(String(sessionAuth.role || "")),
      stationIds: Array.isArray(body.stationIds)
        ? body.stationIds.filter((x: unknown) => typeof x === "string")
        : (sessionAuth.stationId ? [sessionAuth.stationId] : []),
    };

    const manageRoles = [
      "owner", "director", "ops_manager", "admin", "pgm", "hr_manager", "hr", "station_manager",
    ];
    const canManage = auth.owner || auth.admin || manageRoles.includes(String(auth.role || ""));

    /** Plan flags from client (company.planConfig) — also accept explicit disables. */
    const plan = normalizePlan(body.planConfig || body.plan);

    const allowedSections = Array.isArray(body.allowedSections)
      ? body.allowedSections.filter((x: unknown) => typeof x === "string")
      : null;

    const loadBlob = async () => {
      const rows = await base44.asServiceRole.entities.CompanyDataBlob.filter({
        companyId: auth.companyId,
        category: ASSISTANT_CATEGORY,
      });
      return rows[0] || null;
    };

    const loadFacts = async (): Promise<AssistantFacts> => {
      const blob = await loadBlob();
      const raw = blob?.payload && typeof blob.payload === "object" ? blob.payload as AssistantFacts : null;
      if (!raw) return emptyFacts(auth.companyId);
      return filterFacts(raw, auth.companyId);
    };

    const saveFacts = async (facts: AssistantFacts) => {
      const blob = await loadBlob();
      const payload = filterFacts(facts, auth.companyId);
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({
          companyId: auth.companyId,
          category: ASSISTANT_CATEGORY,
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

    const featureGate = checkAskGate({
      question: "ping",
      plan,
      actor: auth,
      careersChannel: body.careersChannel === true,
      crossTenant: body.crossTenant === true
        || (typeof body.requestCompanyId === "string"
          && body.requestCompanyId.trim()
          && body.requestCompanyId.trim() !== auth.companyId),
      allowedSections,
    });
    // FEATURE_DISABLED / careers / cross-tenant block the whole surface.
    if (!featureGate.ok && (featureGate.error === "FEATURE_DISABLED" || featureGate.error === "OUT_OF_SCOPE")) {
      if (action === "authorize" || action === "board" || action === "ask" || action === "seedDemo") {
        return Response.json({
          ok: false,
          error: featureGate.error,
          reason: featureGate.reason,
          reasonEn: featureGate.reasonEn,
          gate: featureGate,
        }, { status: 403 });
      }
    }

    const packBoard = (facts: AssistantFacts, activePromptId?: AssistantPromptId | null) => {
      const board = buildAssistantBoard({
        facts,
        actor: auth,
        companyId: auth.companyId,
        activePromptId: activePromptId || "task_drop_spotlight",
      });
      return {
        ok: true,
        companyId: auth.companyId,
        section: ASSISTANT_SECTION,
        feature: AI_FEATURE,
        stationCount: board.stationCount,
        prompts: board.prompts,
        answer: board.answer,
        subtitleAr: "يقرأ بياناتك ويجيب بالمصدر",
        subtitleEn: "Reads your data, answers with sources",
      };
    };

    if (action === "authorize") {
      const gate = checkAskGate({
        question: body.question,
        promptId: body.promptId,
        plan,
        actor: auth,
        careersChannel: body.careersChannel === true,
        crossTenant: body.crossTenant === true,
        allowedSections,
      });
      if (!gate.ok) {
        return Response.json({
          ok: false,
          error: gate.error,
          reason: gate.reason,
          reasonEn: gate.reasonEn,
          gate,
          allowLlm: false,
        }, { status: 400 });
      }
      return Response.json({
        ok: true,
        allowLlm: !gate.entry, // known prompts are server-derived; free-form may use existing LLM
        promptId: gate.entry?.id || null,
        companyId: auth.companyId,
        scope: {
          allStations: !!auth.allStations,
          stationIds: auth.stationIds || [],
          role: auth.role,
        },
      });
    }

    if (action === "board") {
      let facts = await loadFacts();
      if (!facts.stations.length) {
        // Prefer empty board over inventing cross-tenant data; seedDemo is explicit.
        return Response.json({
          ...packBoard(facts),
          empty: true,
          hintAr: "لا حقائق مشتقة بعد — شغّل seedDemo أو اربط مصادر العمليات/الحضور.",
          hintEn: "No derived facts yet — run seedDemo or wire ops/attendance sources.",
        });
      }
      const active = typeof body.promptId === "string" ? body.promptId as AssistantPromptId : "task_drop_spotlight";
      return Response.json(packBoard(facts, active));
    }

    if (action === "seedDemo") {
      if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });
      const existing = await loadFacts();
      if (existing.stations.length > 0) {
        return Response.json(packBoard(existing));
      }
      const facts = demoAssistantFacts(auth.companyId);
      await saveFacts(facts);
      await audit("assistant.seedDemo", "Seeded assistant derived facts board");
      return Response.json(packBoard(facts));
    }

    if (action === "ask") {
      const gate = checkAskGate({
        question: body.question,
        promptId: body.promptId,
        plan,
        actor: auth,
        careersChannel: body.careersChannel === true,
        crossTenant: body.crossTenant === true,
        allowedSections,
      });
      if (!gate.ok) {
        return Response.json({
          ok: false,
          error: gate.error,
          reason: gate.reason,
          reasonEn: gate.reasonEn,
          gate,
        }, { status: 400 });
      }

      const facts = await loadFacts();
      const promptId = (gate.entry?.id || body.promptId) as AssistantPromptId | undefined;

      if (promptId && gate.entry) {
        const packed = packBoard(facts, promptId);
        await audit("assistant.ask", `Derived answer for ${promptId}`, {
          newValue: { promptId, mode: "derived" },
        });
        return Response.json({
          ...packed,
          mode: "derived",
          allowLlm: false,
        });
      }

      // Free-form: authorize + return scoped station ids for the existing LLM path.
      await audit("assistant.ask", "Authorized free-form question for scoped LLM", {
        newValue: { mode: "scoped_llm" },
      });
      return Response.json({
        ok: true,
        mode: "scoped_llm",
        allowLlm: true,
        companyId: auth.companyId,
        scope: {
          allStations: !!auth.allStations,
          stationIds: auth.stationIds || [],
          role: auth.role,
        },
        question: gate.question,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String((error as Error)?.message || error) }, { status: 500 });
  }
});
