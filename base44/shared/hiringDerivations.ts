/** Recruitment / onboarding — SLA from vacancy open day; named gates.
 *  Design: NiroVera Platform.dc.html (RQ_STAGES / canAdvance / hire ready).
 */

export const RQ_STAGES = [
  { id: "req", sla: 3 },
  { id: "post", sla: 5 },
  { id: "screen", sla: 7 },
  { id: "intv", sla: 7 },
  { id: "offer", sla: 5 },
] as const;

export type RqStageId = (typeof RQ_STAGES)[number]["id"];

export const HIRE_STEPS = [
  { id: "offer", must: true, saudiOnlySkip: false },
  { id: "qiwa", must: true, saudiOnlySkip: false },
  { id: "gosi", must: true, saudiOnlySkip: false },
  { id: "med", must: true, saudiOnlySkip: false },
  { id: "iqama", must: true, saudiOnlySkip: true }, // non-Saudis only
  { id: "hse", must: true, saudiOnlySkip: false },
  { id: "assets", must: false, saudiOnlySkip: false },
] as const;

export type HireStepId = (typeof HIRE_STEPS)[number]["id"];

export type ChosenPick = {
  applicantId?: string | null;
  name?: string | null;
  nameEn?: string | null;
  saudi?: boolean;
};

export type VacancyLike = {
  key: string;
  title: string;
  stationId: string;
  grade?: string;
  count?: number;
  opened: string; // YYYY-MM-DD — SLA clock starts here
  at?: number; // stage index completed count / current stage
  nitaqatEffectStated?: boolean;
  nitaqatNote?: string | null;
  saudiFirst?: boolean;
  chosen?: ChosenPick | null;
  withdrawn?: boolean;
  companyId?: string;
};

export type ApplicantLike = {
  id: string;
  vacancyKey: string;
  name: string;
  nameEn?: string;
  saudi?: boolean;
  exp?: number;
  state?: "new" | "short" | "intv" | "out" | "pick";
  rejectReason?: string | null;
};

export type OnboardingLike = {
  key: string;
  name: string;
  saudi?: boolean;
  start?: string | null;
  vacancyKey?: string | null;
  stepsDone?: Record<string, boolean>;
  confirmed?: boolean;
};

function parseDay(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Cumulative SLA days from stage 0 through `at` (inclusive). Clock = vacancy open day. */
export function cumulativeSlaDays(at: number) {
  const idx = Math.max(0, Math.min(at, RQ_STAGES.length - 1));
  let acc = 0;
  for (let i = 0; i <= idx; i++) acc += RQ_STAGES[i].sla;
  return acc;
}

export function stageDueDate(opened: string, at: number) {
  const start = parseDay(opened);
  if (!start) return null;
  const due = new Date(start.getTime() + cumulativeSlaDays(at) * 86400000);
  return isoLocal(due);
}

export function daysUntil(dueIso: string, now: Date = new Date()) {
  const due = parseDay(dueIso);
  if (!due) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function daysOpen(opened: string, now: Date = new Date()) {
  const start = parseDay(opened);
  if (!start) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

export function deriveVacancyBoard(vacancy: VacancyLike, now: Date = new Date()) {
  const at = Math.max(0, Number(vacancy.at) || 0);
  const done = at >= RQ_STAGES.length;
  const stageIdx = done ? RQ_STAGES.length - 1 : Math.min(at, RQ_STAGES.length - 1);
  const stage = RQ_STAGES[stageIdx];
  const due = done ? null : stageDueDate(vacancy.opened, at);
  const left = due ? daysUntil(due, now) : null;
  const late = !done && left != null && left < 0;
  const pickName = vacancy.chosen?.name || vacancy.chosen?.nameEn || "";
  const canAdvance = !done && !(at === RQ_STAGES.length - 1 && !pickName);
  return {
    key: vacancy.key,
    at,
    done,
    stageId: stage.id,
    stageSla: stage.sla,
    due,
    daysLeft: left,
    late,
    ageDays: daysOpen(vacancy.opened, now),
    pickName: pickName || null,
    canAdvance,
    nitaqatEffectStated: !!vacancy.nitaqatEffectStated,
    withdrawn: !!vacancy.withdrawn,
  };
}

export function checkAdvanceGate(vacancy: VacancyLike | null | undefined) {
  if (!vacancy) {
    return { ok: false as const, error: "VACANCY_NOT_FOUND", reason: "الشاغر غير موجود.", reasonEn: "Vacancy not found." };
  }
  const at = Math.max(0, Number(vacancy.at) || 0);
  if (at >= RQ_STAGES.length) {
    return { ok: false as const, error: "ALREADY_DONE", reason: "الشاغر مكتمل وانتقل للتعيين.", reasonEn: "Vacancy already complete — moved to onboarding." };
  }
  // Leaving requisition → posting requires Nitaqat effect to be stated.
  if (at === 0 && !vacancy.nitaqatEffectStated) {
    return {
      ok: false as const,
      error: "NITAQAT_EFFECT_REQUIRED",
      reason: "لا إعلان قبل بيان أثر الشاغر على نطاقات.",
      reasonEn: "Cannot post before the Nitaqat effect of this vacancy is stated.",
    };
  }
  // Completing the offer stage requires a named shortlist pick.
  if (at === RQ_STAGES.length - 1) {
    const pick = vacancy.chosen?.name || vacancy.chosen?.nameEn;
    if (!pick) {
      return {
        ok: false as const,
        error: "OFFER_PICK_REQUIRED",
        reason: "لا يمكن إصدار العرض — لم يُختر مرشح من القائمة القصيرة.",
        reasonEn: "Offer blocked — no candidate has been selected from the shortlist.",
      };
    }
  }
  return { ok: true as const, nextAt: at + 1 };
}

export function checkRejectGate(reason: string | null | undefined) {
  const r = String(reason || "").trim();
  if (!r) {
    return {
      ok: false as const,
      error: "REJECT_REASON_REQUIRED",
      reason: "كل استبعاد يحتاج سببًا مقيَّدًا.",
      reasonEn: "Every rejection requires a recorded reason.",
    };
  }
  return { ok: true as const, reason: r };
}

export function applicableHireSteps(saudi: boolean) {
  return HIRE_STEPS.filter((s) => !(s.saudiOnlySkip && saudi));
}

export function deriveOnboardingStatus(hire: OnboardingLike) {
  const steps = applicableHireSteps(!!hire.saudi);
  const doneMap = hire.stepsDone || {};
  const doneN = steps.filter((s) => !!doneMap[s.id]).length;
  const blocking = steps.filter((s) => s.must && !doneMap[s.id]);
  return {
    key: hire.key,
    doneN,
    total: steps.length,
    blockingIds: blocking.map((s) => s.id),
    ready: blocking.length === 0,
    confirmed: !!hire.confirmed,
  };
}

export function checkConfirmStartGate(hire: OnboardingLike | null | undefined) {
  if (!hire) {
    return { ok: false as const, error: "HIRE_NOT_FOUND", reason: "ملف التعيين غير موجود.", reasonEn: "Onboarding record not found." };
  }
  if (hire.confirmed) {
    return { ok: false as const, error: "ALREADY_CONFIRMED", reason: "المباشرة معتمدة مسبقًا.", reasonEn: "Start already confirmed." };
  }
  const status = deriveOnboardingStatus(hire);
  if (!status.ready) {
    return {
      ok: false as const,
      error: "MANDATORY_STEPS_OPEN",
      reason: `لا يجوز تحديد المباشرة — ينقص ${status.blockingIds.length} إجراء نظامي.`,
      reasonEn: `Start date blocked — ${status.blockingIds.length} mandatory step(s) outstanding.`,
      blockingIds: status.blockingIds,
    };
  }
  return { ok: true as const };
}

export function deriveHiringStats(vacancies: VacancyLike[], applicants: ApplicantLike[], now: Date = new Date()) {
  const open = vacancies.filter((v) => (Number(v.at) || 0) < RQ_STAGES.length && !v.withdrawn);
  const vacN = open.reduce((n, v) => n + Math.max(1, Number(v.count) || 1), 0);
  const appN = applicants.filter((a) => open.some((v) => v.key === a.vacancyKey)).length;
  const ages = open.map((v) => daysOpen(v.opened, now));
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const late = open.filter((v) => deriveVacancyBoard(v, now).late).length;
  return { vacanciesOpen: vacN, applications: appN, avgDaysOpen: avgAge, stagesLate: late };
}
