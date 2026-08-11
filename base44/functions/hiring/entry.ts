import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";
import {
  buildApplicationRef,
  checkAdvanceGate,
  checkConfirmStartGate,
  checkPublicApplyGate,
  checkRejectGate,
  deriveHiringStats,
  deriveOnboardingStatus,
  deriveVacancyBoard,
  isoLocal,
  isVacancyPubliclyListed,
  RQ_STAGES,
  type ApplicantLike,
  type OnboardingLike,
  type VacancyLike,
} from "../../shared/hiringDerivations.ts";

const HIRING_CATEGORY = "hiringPipeline";

function requireCompanyId(companyId: unknown) {
  const id = typeof companyId === "string" ? companyId.trim() : "";
  if (!id) return null;
  return id;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type HiringPayload = {
  vacancies: VacancyLike[];
  applicants: ApplicantLike[];
  onboarding: OnboardingLike[];
};

function emptyPayload(): HiringPayload {
  return { vacancies: [], applicants: [], onboarding: [] };
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

    const loadBlobFor = async (cid: string) => {
      const rows = await base44.asServiceRole.entities.CompanyDataBlob.filter({
        companyId: cid,
        category: HIRING_CATEGORY,
      });
      return rows[0] || null;
    };

    const loadPayloadFor = async (cid: string): Promise<HiringPayload> => {
      const blob = await loadBlobFor(cid);
      const raw = blob?.payload && typeof blob.payload === "object" ? blob.payload : {};
      const vacancies = (Array.isArray(raw.vacancies) ? raw.vacancies : []).filter(
        (v: VacancyLike) => v && v.companyId === cid && v.key,
      );
      const applicants = (Array.isArray(raw.applicants) ? raw.applicants : []).filter(
        (a: ApplicantLike & { companyId?: string }) => a && a.companyId === cid && a.id,
      );
      const onboarding = (Array.isArray(raw.onboarding) ? raw.onboarding : []).filter(
        (h: OnboardingLike & { companyId?: string }) => h && h.companyId === cid && h.key,
      );
      return { vacancies, applicants, onboarding };
    };

    const savePayloadFor = async (cid: string, payload: HiringPayload) => {
      const blob = await loadBlobFor(cid);
      if (blob) await base44.asServiceRole.entities.CompanyDataBlob.update(blob.id, { payload });
      else {
        await base44.asServiceRole.entities.CompanyDataBlob.create({
          companyId: cid,
          category: HIRING_CATEGORY,
          payload,
        });
      }
    };

    const resolveCompanyPublic = async (cid: string) => {
      const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId: cid });
      const account = accounts[0] || null;
      return {
        companyId: cid,
        name: account?.name || null,
      };
    };

    // Public careers channel — no employee session. One-way only: list open
    // vacancies + write applications. Never returns employee or payroll data.
    if (action === "publicList" || action === "publicApply" || action === "publicDeleteRequest") {
      const company = await resolveCompanyPublic(companyId);
      if (!company.name) {
        return Response.json({ error: "COMPANY_NOT_FOUND", reason: "الشركة غير موجودة." }, { status: 404 });
      }

      if (action === "publicList") {
        const data = await loadPayloadFor(companyId);
        const stations = await base44.asServiceRole.entities.Station.filter({ companyId });
        const stationName = (id: string) =>
          stations.find((s: { id?: string; stationId?: string; name?: string }) =>
            (s.stationId || s.id) === id
          )?.name || id || "—";
        const vacancies = data.vacancies
          .filter((v) => isVacancyPubliclyListed(v))
          .map((v) => ({
            key: v.key,
            title: v.title,
            grade: v.grade || "—",
            stationId: v.stationId,
            stationName: stationName(v.stationId),
            opened: v.opened,
            saudiFirst: v.saudiFirst !== false,
            count: Math.max(1, Number(v.count) || 1),
            ageDays: deriveVacancyBoard(v).ageDays,
          }));
        return Response.json({
          ok: true,
          company,
          vacancies,
          employees: null,
        });
      }

      if (action === "publicApply") {
        const gate = checkPublicApplyGate({
          name: body.name,
          phone: body.phone,
          vacancyKey: body.vacancyKey || body.key,
        });
        if (!gate.ok) {
          return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
        }
        const data = await loadPayloadFor(companyId);
        const vacancy = data.vacancies.find((v) => v.key === gate.vacancyKey);
        if (!vacancy || !isVacancyPubliclyListed(vacancy)) {
          return Response.json({
            error: "VACANCY_NOT_FOUND",
            reason: "هذا الشاغر غير معلن أو أُغلق.",
            reasonEn: "This vacancy is not listed or has closed.",
          }, { status: 404 });
        }
        const phone = gate.phone;
        const dup = data.applicants.find(
          (a) => a.vacancyKey === gate.vacancyKey && a.phone === phone && a.state !== "out",
        );
        if (dup?.ref) {
          return Response.json({
            ok: true,
            duplicate: true,
            ref: dup.ref,
            reason: "طلبك مسجّل مسبقًا بهذا الرقم المرجعي.",
            reasonEn: "An application with this phone is already on file for this vacancy.",
          });
        }
        const ref = buildApplicationRef(gate.vacancyKey, `${phone}|${gate.name}`);
        const applicant: ApplicantLike & { companyId: string } = {
          companyId,
          id: uid("app"),
          vacancyKey: gate.vacancyKey,
          name: gate.name,
          nameEn: String(body.nameEn || gate.name).trim() || gate.name,
          saudi: body.saudi !== false && String(body.nat || "saudi") !== "other",
          exp: Math.max(0, Number(body.exp) || 0),
          state: "new",
          ref,
          phone,
          email: String(body.email || "").trim().slice(0, 120) || null,
          nationalId: String(body.nationalId || body.idNumber || "").trim().slice(0, 20) || null,
          cvName: String(body.cvName || "").trim().slice(0, 160) || null,
          source: "careers",
          appliedAt: new Date().toISOString(),
        };
        data.applicants = [applicant, ...data.applicants];
        await savePayloadFor(companyId, data);
        await base44.asServiceRole.entities.AuditLog.create({
          companyId,
          action: "hiring.publicApply",
          performedBy: `careers:${ref}`,
          details: `Public careers application ${ref} for ${gate.vacancyKey}`,
          newValue: ref,
        });
        return Response.json({
          ok: true,
          ref,
          company: { companyId: company.companyId, name: company.name },
          vacancy: { key: vacancy.key, title: vacancy.title },
        });
      }

      if (action === "publicDeleteRequest") {
        const ref = String(body.ref || "").trim().toUpperCase();
        if (!ref.startsWith("NV-APP-")) {
          return Response.json({
            error: "REF_REQUIRED",
            reason: "الرقم المرجعي مطلوب.",
            reasonEn: "Reference number is required.",
          }, { status: 400 });
        }
        const data = await loadPayloadFor(companyId);
        const idx = data.applicants.findIndex((a) => String(a.ref || "").toUpperCase() === ref);
        if (idx < 0) {
          return Response.json({ ok: true, received: true });
        }
        data.applicants[idx] = { ...data.applicants[idx], deletionRequested: true };
        await savePayloadFor(companyId, data);
        await base44.asServiceRole.entities.AuditLog.create({
          companyId,
          action: "hiring.publicDeleteRequest",
          performedBy: `careers:${ref}`,
          details: `Deletion requested for careers application ${ref}`,
          reason: ref,
        });
        return Response.json({ ok: true, received: true });
      }
    }

    const sessionAuth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!sessionAuth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const auth = {
      companyId,
      userId: sessionAuth.userId || null,
      name: sessionAuth.name || "User",
      role: sessionAuth.role || "employee",
      stationId: sessionAuth.stationId || null,
      owner: !!sessionAuth.owner || sessionAuth.role === "owner" || sessionAuth.admin,
      admin: !!sessionAuth.admin,
    };

    const hrRoles = ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"];
    const isHr = auth.owner || auth.admin || hrRoles.includes(auth.role);

    const loadPayload = async () => loadPayloadFor(auth.companyId);
    const savePayload = async (payload: HiringPayload) => savePayloadFor(auth.companyId, payload);

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

    const enrich = (data: HiringPayload) => {
      const now = new Date();
      const boards = data.vacancies.map((v) => {
        const board = deriveVacancyBoard(v, now);
        const apps = data.applicants.filter((a) => a.vacancyKey === v.key);
        return {
          ...v,
          board,
          applicants: apps,
          stages: RQ_STAGES,
        };
      });
      const hires = data.onboarding.map((h) => ({
        ...h,
        status: deriveOnboardingStatus(h),
      }));
      return {
        ok: true,
        vacancies: boards,
        onboarding: hires,
        stats: deriveHiringStats(data.vacancies, data.applicants, now),
        stages: RQ_STAGES,
      };
    };

    if (action === "list") {
      const data = await loadPayload();
      return Response.json(enrich(data));
    }

    if (!isHr) {
      return Response.json({ error: "Forbidden — HR/manager role required" }, { status: 403 });
    }

    if (action === "openVacancy") {
      const title = String(body.title || "").trim();
      const stationId = String(body.stationId || "").trim();
      if (!title || !stationId) {
        return Response.json({ error: "TITLE_STATION_REQUIRED", reason: "المسمى والمحطة مطلوبان." }, { status: 400 });
      }
      const data = await loadPayload();
      const key = String(body.key || uid("rq")).replace(/\s+/g, "");
      const vacancy: VacancyLike & { companyId: string } = {
        companyId: auth.companyId,
        key,
        title,
        stationId,
        grade: String(body.grade || "G6"),
        count: Math.max(1, Number(body.count) || 1),
        opened: String(body.opened || isoLocal(new Date())),
        at: 0,
        nitaqatEffectStated: false,
        saudiFirst: body.saudiFirst !== false,
        chosen: null,
        withdrawn: false,
      };
      data.vacancies = [vacancy, ...data.vacancies];
      await savePayload(data);
      await audit("hiring.openVacancy", `Opened vacancy ${title} (${key})`, { newValue: key });
      return Response.json({ ok: true, vacancy, ...enrich(data) });
    }

    if (action === "stateNitaqatEffect") {
      const key = String(body.key || "");
      const data = await loadPayload();
      const idx = data.vacancies.findIndex((v) => v.key === key);
      if (idx < 0) return Response.json({ error: "VACANCY_NOT_FOUND" }, { status: 404 });
      const note = String(body.note || "").trim() || null;
      data.vacancies[idx] = {
        ...data.vacancies[idx],
        nitaqatEffectStated: true,
        nitaqatNote: note,
      };
      await savePayload(data);
      await audit("hiring.nitaqatEffect", `Nitaqat effect stated for ${key}`, { reason: note });
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "advance") {
      const key = String(body.key || "");
      const data = await loadPayload();
      const idx = data.vacancies.findIndex((v) => v.key === key);
      if (idx < 0) return Response.json({ error: "VACANCY_NOT_FOUND", reason: "الشاغر غير موجود." }, { status: 404 });
      const vacancy = data.vacancies[idx];
      const gate = checkAdvanceGate(vacancy);
      if (!gate.ok) {
        return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
      }
      const nextAt = gate.nextAt;
      data.vacancies[idx] = { ...vacancy, at: nextAt };

      // Completing offer moves candidate into onboarding.
      if (nextAt >= RQ_STAGES.length && vacancy.chosen?.name) {
        const hireKey = `rq_${key}`;
        if (!data.onboarding.some((h) => h.key === hireKey)) {
          data.onboarding.push({
            companyId: auth.companyId,
            key: hireKey,
            name: vacancy.chosen.name,
            saudi: vacancy.chosen.saudi !== false,
            vacancyKey: key,
            start: null,
            stepsDone: {},
            confirmed: false,
          } as OnboardingLike & { companyId: string });
        }
      }

      await savePayload(data);
      await audit("hiring.advance", `Advanced ${key} to stage index ${nextAt}`, {
        oldValue: String(vacancy.at || 0),
        newValue: String(nextAt),
      });
      return Response.json({ ok: true, at: nextAt, ...enrich(data) });
    }

    if (action === "addApplicant") {
      const vacancyKey = String(body.vacancyKey || "");
      const name = String(body.name || "").trim();
      const data = await loadPayload();
      if (!data.vacancies.some((v) => v.key === vacancyKey)) {
        return Response.json({ error: "VACANCY_NOT_FOUND" }, { status: 404 });
      }
      if (!name) return Response.json({ error: "NAME_REQUIRED" }, { status: 400 });
      const applicant: ApplicantLike & { companyId: string } = {
        companyId: auth.companyId,
        id: uid("app"),
        vacancyKey,
        name,
        nameEn: String(body.nameEn || name),
        saudi: body.saudi !== false,
        exp: Number(body.exp) || 0,
        state: "new",
      };
      data.applicants = [...data.applicants, applicant];
      await savePayload(data);
      await audit("hiring.addApplicant", `Added applicant ${name} to ${vacancyKey}`);
      return Response.json({ ok: true, applicant, ...enrich(data) });
    }

    if (action === "setApplicantState") {
      const id = String(body.id || "");
      const state = String(body.state || "") as ApplicantLike["state"];
      const allowed = ["new", "short", "intv", "out", "pick"];
      if (!allowed.includes(state || "")) {
        return Response.json({ error: "INVALID_STATE" }, { status: 400 });
      }
      const data = await loadPayload();
      const idx = data.applicants.findIndex((a) => a.id === id);
      if (idx < 0) return Response.json({ error: "APPLICANT_NOT_FOUND" }, { status: 404 });

      if (state === "out") {
        const gate = checkRejectGate(body.reason);
        if (!gate.ok) {
          return Response.json({ error: gate.error, reason: gate.reason, reasonEn: gate.reasonEn }, { status: 400 });
        }
        data.applicants[idx] = { ...data.applicants[idx], state: "out", rejectReason: gate.reason };
      } else if (state === "pick") {
        const app = data.applicants[idx];
        data.applicants[idx] = { ...app, state: "pick" };
        // Clear other picks on same vacancy; set chosen on vacancy.
        data.applicants = data.applicants.map((a) =>
          a.vacancyKey === app.vacancyKey && a.id !== id && a.state === "pick" ? { ...a, state: "short" } : a,
        );
        const vIdx = data.vacancies.findIndex((v) => v.key === app.vacancyKey);
        if (vIdx >= 0) {
          data.vacancies[vIdx] = {
            ...data.vacancies[vIdx],
            chosen: {
              applicantId: app.id,
              name: app.name,
              nameEn: app.nameEn || app.name,
              saudi: app.saudi !== false,
            },
          };
        }
      } else {
        data.applicants[idx] = { ...data.applicants[idx], state };
      }

      await savePayload(data);
      await audit("hiring.setApplicantState", `Applicant ${id} → ${state}`, { reason: body.reason || null });
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "completeHireStep") {
      const key = String(body.key || "");
      const stepId = String(body.stepId || "");
      const data = await loadPayload();
      const idx = data.onboarding.findIndex((h) => h.key === key);
      if (idx < 0) return Response.json({ error: "HIRE_NOT_FOUND" }, { status: 404 });
      const hire = data.onboarding[idx];
      data.onboarding[idx] = {
        ...hire,
        stepsDone: { ...(hire.stepsDone || {}), [stepId]: true },
      };
      await savePayload(data);
      await audit("hiring.completeStep", `Hire ${key} completed ${stepId}`);
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "confirmStart") {
      const key = String(body.key || "");
      const data = await loadPayload();
      const idx = data.onboarding.findIndex((h) => h.key === key);
      if (idx < 0) return Response.json({ error: "HIRE_NOT_FOUND" }, { status: 404 });
      const hire = data.onboarding[idx];
      const gate = checkConfirmStartGate(hire);
      if (!gate.ok) {
        return Response.json({
          error: gate.error,
          reason: gate.reason,
          reasonEn: gate.reasonEn,
          blockingIds: "blockingIds" in gate ? gate.blockingIds : undefined,
        }, { status: 400 });
      }
      const start = String(body.start || isoLocal(new Date()));
      data.onboarding[idx] = { ...hire, start, confirmed: true };
      await savePayload(data);
      await audit("hiring.confirmStart", `Confirmed start for ${key} on ${start}`);
      return Response.json({ ok: true, ...enrich(data) });
    }

    if (action === "withdraw") {
      const key = String(body.key || "");
      const data = await loadPayload();
      const idx = data.vacancies.findIndex((v) => v.key === key);
      if (idx < 0) return Response.json({ error: "VACANCY_NOT_FOUND" }, { status: 404 });
      data.vacancies[idx] = { ...data.vacancies[idx], withdrawn: true };
      await savePayload(data);
      await audit("hiring.withdraw", `Withdrew posting ${key}`);
      return Response.json({ ok: true, ...enrich(data) });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
});
