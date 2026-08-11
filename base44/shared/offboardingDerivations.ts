/** Assets / custody offboarding — return gate + Article 84 EOS.
 *  Design: NiroVera Platform.dc.html (offboarding / offAssets / eos / offComplete).
 */

export const ANNUAL_ENTITLEMENT_DAYS = 21;
/** Milliseconds in a mean Gregorian year (365.25d) — matches design svcYears. */
export const MS_PER_YEAR = 31557600000;

export type CustodyAssetStatus = "outstanding" | "returned";

export type CustodyAssetLike = {
  id: string;
  name: string;
  serial?: string | null;
  status?: CustodyAssetStatus;
  returnedAt?: string | null;
  returnedBy?: string | null;
};

export type OffboardingCaseLike = {
  id?: string;
  companyId?: string;
  employeeId: string;
  employeeName?: string;
  stationId?: string | null;
  hireDate?: string | null;
  /** Monthly base wage (SAR). */
  base?: number;
  /** Monthly allowances (SAR). */
  allowances?: number;
  /** Annual leave days already used in the entitlement year. */
  annualLeaveUsed?: number;
  status?: "in_progress" | "completed";
  accessRevoked?: boolean;
  qiwaNotified?: boolean;
  safetyCleared?: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  assets?: CustodyAssetLike[];
};

export type OffboardingStepId =
  | "assets"
  | "safety"
  | "settlement"
  | "access"
  | "qiwa"
  | "certificate";

export type OffboardingStepState = "blocked" | "done" | "ready" | "on_completion";

function parseLocalDate(isoDate: string | null | undefined) {
  const s = String(isoDate || "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Service years from hire date (local midnight) — design: Date.now − hire / 31557600000. */
export function serviceYears(hireDate: string | null | undefined, nowMs = Date.now()) {
  const d = parseLocalDate(hireDate);
  if (!d) return 0;
  return Math.max(0, (nowMs - d.getTime()) / MS_PER_YEAR);
}

export function isPreStart(hireDate: string | null | undefined, nowMs = Date.now()) {
  const d = parseLocalDate(hireDate);
  if (!d) return false;
  return d.getTime() > nowMs;
}

export function finalWage(base: number, allowances: number) {
  return Math.max(0, Number(base) || 0) + Math.max(0, Number(allowances) || 0);
}

/**
 * Article 84 EOS gratuity on final total wage:
 * half month × first 5 years + full month × years beyond 5.
 */
export function eosGratuity(years: number, wage: number) {
  const yrs = Math.max(0, Number(years) || 0);
  const w = Math.max(0, Number(wage) || 0);
  return Math.round((Math.min(yrs, 5) * 0.5 + Math.max(0, yrs - 5)) * w);
}

export function unusedAnnualDays(annualLeaveUsed: number, entitlement = ANNUAL_ENTITLEMENT_DAYS) {
  return Math.max(0, entitlement - Math.max(0, Number(annualLeaveUsed) || 0));
}

/** Unused annual leave cash: (wage / 30) × unused days. */
export function leaveCashout(wage: number, unusedDays: number) {
  const w = Math.max(0, Number(wage) || 0);
  const days = Math.max(0, Number(unusedDays) || 0);
  return Math.round((w / 30) * days);
}

export function enrichAsset(asset: CustodyAssetLike) {
  const status: CustodyAssetStatus =
    asset.status === "returned" || asset.returnedAt ? "returned" : "outstanding";
  return {
    ...asset,
    serial: asset.serial || null,
    status,
    outstanding: status === "outstanding",
    returnedAt: status === "returned" ? asset.returnedAt || null : null,
  };
}

export function outstandingAssets(assets: CustodyAssetLike[] = []) {
  return assets.map(enrichAsset).filter((a) => a.outstanding);
}

export function outstandingCount(assets: CustodyAssetLike[] = []) {
  return outstandingAssets(assets).length;
}

/** Gate open only when every assigned asset is returned. */
export function isOffboardingGateOpen(assets: CustodyAssetLike[] = []) {
  return outstandingCount(assets) === 0;
}

export function deriveEos(caseRow: OffboardingCaseLike, nowMs = Date.now()) {
  const hireDate = caseRow.hireDate || null;
  const preStart = isPreStart(hireDate, nowMs);
  const years = preStart ? 0 : serviceYears(hireDate, nowMs);
  const wage = finalWage(Number(caseRow.base) || 0, Number(caseRow.allowances) || 0);
  const unused = unusedAnnualDays(Number(caseRow.annualLeaveUsed) || 0);
  const gratuity = preStart ? 0 : eosGratuity(years, wage);
  const leave = preStart ? 0 : leaveCashout(wage, unused);
  return {
    hireDate,
    preStart,
    years,
    wage,
    unusedAnnualDays: unused,
    firstFive: preStart ? 0 : Math.round(Math.min(years, 5) * 0.5 * wage),
    beyondFive: preStart ? 0 : Math.round(Math.max(0, years - 5) * wage),
    gratuity,
    leaveCash: leave,
    total: gratuity + leave,
  };
}

export function deriveOffboardingSteps(caseRow: OffboardingCaseLike) {
  const assets = (caseRow.assets || []).map(enrichAsset);
  const outstanding = outstandingCount(assets);
  const completed = caseRow.status === "completed";
  const assetsDone = outstanding === 0 && assets.length > 0;
  const safetyDone = caseRow.safetyCleared !== false; // design demo: safety already cleared
  const accessDone = !!(caseRow.accessRevoked || completed);
  const qiwaDone = !!(caseRow.qiwaNotified || completed);

  const steps: Array<{ id: OffboardingStepId; state: OffboardingStepState }> = [
    { id: "assets", state: assetsDone ? "done" : "blocked" },
    { id: "safety", state: safetyDone ? "done" : "blocked" },
    { id: "settlement", state: "ready" },
    { id: "access", state: accessDone ? "done" : "on_completion" },
    { id: "qiwa", state: qiwaDone ? "done" : "on_completion" },
    { id: "certificate", state: completed ? "done" : "on_completion" },
  ];
  return steps;
}

export function enrichOffboardingCase(caseRow: OffboardingCaseLike, nowMs = Date.now()) {
  const assets = (caseRow.assets || []).map(enrichAsset);
  const outstanding = outstandingCount(assets);
  const gateOpen = isOffboardingGateOpen(assets) && assets.length > 0;
  const status = caseRow.status === "completed" ? "completed" : "in_progress";
  return {
    ...caseRow,
    status,
    assets,
    outstandingCount: outstanding,
    gateOpen: status === "completed" ? false : gateOpen,
    eos: deriveEos(caseRow, nowMs),
    steps: deriveOffboardingSteps({ ...caseRow, assets, status }),
    accessRevoked: !!(caseRow.accessRevoked || status === "completed"),
    qiwaNotified: !!(caseRow.qiwaNotified || status === "completed"),
  };
}

export function checkMarkReturnedGate(
  caseRow: OffboardingCaseLike | null | undefined,
  assetId: string,
) {
  if (!caseRow) {
    return {
      ok: false as const,
      error: "CASE_NOT_FOUND",
      reason: "ملف إنهاء الخدمة غير موجود.",
      reasonEn: "Offboarding case not found.",
    };
  }
  if (caseRow.status === "completed") {
    return {
      ok: false as const,
      error: "ALREADY_COMPLETED",
      reason: "الخدمة منتهية بالفعل.",
      reasonEn: "Offboarding already completed.",
    };
  }
  const id = String(assetId || "").trim();
  const asset = (caseRow.assets || []).find((a) => a.id === id);
  if (!asset) {
    return {
      ok: false as const,
      error: "ASSET_NOT_FOUND",
      reason: "العهدة غير موجودة.",
      reasonEn: "Asset not found.",
    };
  }
  if (enrichAsset(asset).status === "returned") {
    return {
      ok: false as const,
      error: "ALREADY_RETURNED",
      reason: "هذه العهدة مُستلمة مسبقًا.",
      reasonEn: "Asset already marked returned.",
    };
  }
  return { ok: true as const, asset };
}

export function checkCompleteOffboardingGate(caseRow: OffboardingCaseLike | null | undefined) {
  if (!caseRow) {
    return {
      ok: false as const,
      error: "CASE_NOT_FOUND",
      reason: "ملف إنهاء الخدمة غير موجود.",
      reasonEn: "Offboarding case not found.",
    };
  }
  if (caseRow.status === "completed") {
    return {
      ok: false as const,
      error: "ALREADY_COMPLETED",
      reason: "الخدمة منتهية بالفعل.",
      reasonEn: "Already completed.",
    };
  }
  const assets = caseRow.assets || [];
  if (assets.length === 0) {
    return {
      ok: false as const,
      error: "NO_ASSETS",
      reason: "لا عهد مسجّلة لهذا الموظف.",
      reasonEn: "No custody assets registered for this employee.",
    };
  }
  const n = outstandingCount(assets);
  if (n > 0) {
    return {
      ok: false as const,
      error: "ASSETS_OUTSTANDING",
      reason: `${n} عهدة لم تُستلم — إنهاء الخدمة موقوف.`,
      reasonEn: `${n} assets outstanding — offboarding is blocked.`,
    };
  }
  return { ok: true as const };
}
