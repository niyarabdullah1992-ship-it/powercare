/** Assets / custody offboarding — return gate + Article 84 EOS.
 *  Design: NiroVera Platform.dc.html (offboarding / offAssets / eos / offComplete).
 *  Keep in sync with base44/shared/offboardingDerivations.ts
 */

export const ANNUAL_ENTITLEMENT_DAYS = 21;
export const MS_PER_YEAR = 31557600000;

function parseLocalDate(isoDate) {
  const s = String(isoDate || "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function serviceYears(hireDate, nowMs = Date.now()) {
  const d = parseLocalDate(hireDate);
  if (!d) return 0;
  return Math.max(0, (nowMs - d.getTime()) / MS_PER_YEAR);
}

export function isPreStart(hireDate, nowMs = Date.now()) {
  const d = parseLocalDate(hireDate);
  if (!d) return false;
  return d.getTime() > nowMs;
}

export function finalWage(base, allowances) {
  return Math.max(0, Number(base) || 0) + Math.max(0, Number(allowances) || 0);
}

export function eosGratuity(years, wage) {
  const yrs = Math.max(0, Number(years) || 0);
  const w = Math.max(0, Number(wage) || 0);
  return Math.round((Math.min(yrs, 5) * 0.5 + Math.max(0, yrs - 5)) * w);
}

export function unusedAnnualDays(annualLeaveUsed, entitlement = ANNUAL_ENTITLEMENT_DAYS) {
  return Math.max(0, entitlement - Math.max(0, Number(annualLeaveUsed) || 0));
}

export function leaveCashout(wage, unusedDays) {
  const w = Math.max(0, Number(wage) || 0);
  const days = Math.max(0, Number(unusedDays) || 0);
  return Math.round((w / 30) * days);
}

export function enrichAsset(asset) {
  const status = asset.status === "returned" || asset.returnedAt ? "returned" : "outstanding";
  return {
    ...asset,
    serial: asset.serial || null,
    status,
    outstanding: status === "outstanding",
    returnedAt: status === "returned" ? asset.returnedAt || null : null,
  };
}

export function outstandingAssets(assets = []) {
  return assets.map(enrichAsset).filter((a) => a.outstanding);
}

export function outstandingCount(assets = []) {
  return outstandingAssets(assets).length;
}

export function isOffboardingGateOpen(assets = []) {
  return outstandingCount(assets) === 0;
}

export function deriveEos(caseRow, nowMs = Date.now()) {
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

export function deriveOffboardingSteps(caseRow) {
  const assets = (caseRow.assets || []).map(enrichAsset);
  const outstanding = outstandingCount(assets);
  const completed = caseRow.status === "completed";
  const assetsDone = outstanding === 0 && assets.length > 0;
  const safetyDone = caseRow.safetyCleared !== false;
  const accessDone = !!(caseRow.accessRevoked || completed);
  const qiwaDone = !!(caseRow.qiwaNotified || completed);

  return [
    { id: "assets", state: assetsDone ? "done" : "blocked" },
    { id: "safety", state: safetyDone ? "done" : "blocked" },
    { id: "settlement", state: "ready" },
    { id: "access", state: accessDone ? "done" : "on_completion" },
    { id: "qiwa", state: qiwaDone ? "done" : "on_completion" },
    { id: "certificate", state: completed ? "done" : "on_completion" },
  ];
}

export function enrichOffboardingCase(caseRow, nowMs = Date.now()) {
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

export function checkMarkReturnedGate(caseRow, assetId) {
  if (!caseRow) {
    return {
      ok: false,
      error: "CASE_NOT_FOUND",
      reason: "ملف إنهاء الخدمة غير موجود.",
      reasonEn: "Offboarding case not found.",
    };
  }
  if (caseRow.status === "completed") {
    return {
      ok: false,
      error: "ALREADY_COMPLETED",
      reason: "الخدمة منتهية بالفعل.",
      reasonEn: "Offboarding already completed.",
    };
  }
  const id = String(assetId || "").trim();
  const asset = (caseRow.assets || []).find((a) => a.id === id);
  if (!asset) {
    return {
      ok: false,
      error: "ASSET_NOT_FOUND",
      reason: "العهدة غير موجودة.",
      reasonEn: "Asset not found.",
    };
  }
  if (enrichAsset(asset).status === "returned") {
    return {
      ok: false,
      error: "ALREADY_RETURNED",
      reason: "هذه العهدة مُستلمة مسبقًا.",
      reasonEn: "Asset already marked returned.",
    };
  }
  return { ok: true, asset };
}

export function checkCompleteOffboardingGate(caseRow) {
  if (!caseRow) {
    return {
      ok: false,
      error: "CASE_NOT_FOUND",
      reason: "ملف إنهاء الخدمة غير موجود.",
      reasonEn: "Offboarding case not found.",
    };
  }
  if (caseRow.status === "completed") {
    return {
      ok: false,
      error: "ALREADY_COMPLETED",
      reason: "الخدمة منتهية بالفعل.",
      reasonEn: "Already completed.",
    };
  }
  const assets = caseRow.assets || [];
  if (assets.length === 0) {
    return {
      ok: false,
      error: "NO_ASSETS",
      reason: "لا عهد مسجّلة لهذا الموظف.",
      reasonEn: "No custody assets registered for this employee.",
    };
  }
  const n = outstandingCount(assets);
  if (n > 0) {
    return {
      ok: false,
      error: "ASSETS_OUTSTANDING",
      reason: `${n} عهدة لم تُستلم — إنهاء الخدمة موقوف.`,
      reasonEn: `${n} assets outstanding — offboarding is blocked.`,
    };
  }
  return { ok: true };
}
