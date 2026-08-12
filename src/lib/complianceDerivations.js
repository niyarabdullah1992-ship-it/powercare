/** Client mirror of base44/shared/complianceDerivations.ts */

export const COMPLIANCE_DOC_KINDS = ["iqama", "work_permit", "gosi", "qiwa_title", "national_id"];
export const EXPIRY_WARN_DAYS = 60;
export const GOSI_EMPLOYEE_RATE = 0.0975;
export const GOSI_EMPLOYER_RATE = 0.1175;

export function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDay(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function daysUntilExpiry(expiryDate, today = localDateKey()) {
  const a = parseDay(today);
  const b = parseDay(expiryDate || "");
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function docLabel(kind) {
  const map = {
    iqama: { ar: "الإقامة", en: "Iqama" },
    work_permit: { ar: "رخصة العمل", en: "Work permit" },
    gosi: { ar: "رقم التأمينات GOSI", en: "GOSI number" },
    qiwa_title: { ar: "المسمى في قوى", en: "Qiwa job title" },
    national_id: { ar: "الهوية الوطنية", en: "National ID" },
  };
  return map[kind] || { ar: kind, en: kind };
}

export function checkComplianceDocGate(input) {
  const emp = input.employee;
  if (!emp) {
    return {
      ok: false,
      error: "EMPLOYEE_REQUIRED",
      reason: "يلزم ملف موظف لفحص الامتثال.",
      reasonEn: "An employee file is required for the compliance check.",
    };
  }
  const today = input.today || localDateKey();
  const required = input.requiredKinds || (emp.saudi
    ? ["national_id", "gosi", "qiwa_title"]
    : ["iqama", "work_permit", "gosi", "qiwa_title"]);
  const docs = Array.isArray(emp.docs) ? emp.docs : [];

  for (const kind of required) {
    if (kind === "iqama" && emp.saudi) continue;
    const doc = docs.find((d) => d.kind === kind);
    const label = docLabel(kind);
    if (!doc || (!doc.number && !doc.expiryDate && kind !== "qiwa_title")) {
      if (kind === "qiwa_title" && emp.qiwaTitle) continue;
      if (kind === "gosi" && emp.gosiNumber) continue;
      if (kind === "national_id" && emp.nationalId) continue;
      return {
        ok: false,
        error: "DOC_MISSING",
        missingKind: kind,
        docLabelAr: label.ar,
        docLabelEn: label.en,
        reason: `موقوف — الوثيقة الناقصة: ${label.ar}.`,
        reasonEn: `Blocked — missing document: ${label.en}.`,
      };
    }
    if (doc.expiryDate) {
      const days = daysUntilExpiry(doc.expiryDate, today);
      if (days != null && days < 0) {
        return {
          ok: false,
          error: "DOC_EXPIRED",
          missingKind: kind,
          docLabelAr: label.ar,
          docLabelEn: label.en,
          days,
          reason: `موقوف — انتهت ${label.ar}.`,
          reasonEn: `Blocked — ${label.en} has expired.`,
        };
      }
      if (days != null && days <= EXPIRY_WARN_DAYS) {
        return {
          ok: false,
          error: "DOC_EXPIRING",
          missingKind: kind,
          docLabelAr: label.ar,
          docLabelEn: label.en,
          days,
          reason: `موقوف — ${label.ar} تنتهي خلال ${days} يومًا (حد ${EXPIRY_WARN_DAYS}).`,
          reasonEn: `Blocked — ${label.en} expires in ${days} days (${EXPIRY_WARN_DAYS}-day gate).`,
        };
      }
    }
  }
  return { ok: true };
}

export function deriveExpiringDocs(employees, today = localDateKey()) {
  const out = [];
  for (const emp of employees || []) {
    for (const doc of emp.docs || []) {
      if (!doc.expiryDate) continue;
      const days = daysUntilExpiry(doc.expiryDate, today);
      if (days == null || days > EXPIRY_WARN_DAYS) continue;
      const label = docLabel(doc.kind);
      out.push({
        employeeId: emp.employeeId,
        name: emp.name,
        kind: String(doc.kind),
        docLabelAr: label.ar,
        docLabelEn: label.en,
        expiryDate: doc.expiryDate,
        days,
      });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

export function deriveNitaqat(employees) {
  const list = (employees || []).filter(Boolean);
  const total = list.length;
  const saudi = list.filter((e) => e.saudi).length;
  const rate = total > 0 ? Math.round((saudi / total) * 1000) / 10 : 0;
  let band = "red";
  if (rate >= 40) band = "platinum";
  else if (rate >= 30) band = "high_green";
  else if (rate >= 20) band = "mid_green";
  else if (rate >= 10) band = "low_green";
  return { total, saudi, nonSaudi: total - saudi, rate, band, bandId: band };
}

export function checkNitaqatHireGate(input) {
  const band = input.nitaqat.band;
  if (band === "red" || band === "low_green") {
    if (!input.candidateSaudi && !input.nitaqatEffectStated) {
      return {
        ok: false,
        error: "NITAQAT_EFFECT_REQUIRED",
        band,
        reason: `نطاق ${band} — يلزم بيان أثر التوظيف على السعودة قبل النشر/التعيين.`,
        reasonEn: `Band ${band} — state the Saudization effect before posting/hiring.`,
      };
    }
  }
  return { ok: true, band };
}

export function deriveGosiMonthly(lines, establishmentNumber) {
  const rows = (lines || []).map((line) => {
    const wage = Math.max(0, Number(line.base || 0) + Number(line.allowances || 0));
    const employeeShare = Math.round(wage * GOSI_EMPLOYEE_RATE * 100) / 100;
    const employerShare = Math.round(wage * GOSI_EMPLOYER_RATE * 100) / 100;
    return {
      employeeId: line.employeeId,
      employeeName: line.employeeName,
      gosiNumber: line.gosiNumber || null,
      contributoryWage: wage,
      employeeShare,
      employerShare,
      total: Math.round((employeeShare + employerShare) * 100) / 100,
    };
  });
  const employeeTotal = rows.reduce((s, r) => s + r.employeeShare, 0);
  const employerTotal = rows.reduce((s, r) => s + r.employerShare, 0);
  return {
    establishmentNumber: establishmentNumber || null,
    employeeRate: GOSI_EMPLOYEE_RATE,
    employerRate: GOSI_EMPLOYER_RATE,
    rows,
    employeeTotal: Math.round(employeeTotal * 100) / 100,
    employerTotal: Math.round(employerTotal * 100) / 100,
    grandTotal: Math.round((employeeTotal + employerTotal) * 100) / 100,
    simulatedSend: true,
  };
}

export function checkGosiFileGate(input) {
  if (!String(input.establishmentNumber || "").trim()) {
    return {
      ok: false,
      error: "GOSI_ESTABLISHMENT_REQUIRED",
      reason: "يلزم رقم منشأة التأمينات في إعدادات الشركة قبل ملف GOSI الشهري.",
      reasonEn: "A GOSI establishment number is required in company settings before the monthly GOSI file.",
    };
  }
  const missing = (input.rows || []).filter((r) => !String(r.gosiNumber || "").trim());
  if (missing.length) {
    return {
      ok: false,
      error: "GOSI_NUMBER_MISSING",
      reason: `${missing.length} موظف بلا رقم تأمينات — أكمل الملف النظامي.`,
      reasonEn: `${missing.length} employees missing a GOSI number — complete the statutory file.`,
      count: missing.length,
    };
  }
  return { ok: true };
}

export function buildWpsFileRows(lines) {
  return (lines || []).map((line) => {
    const expected = Math.max(0, Number(line.base || 0) + Number(line.allowances || 0));
    const qiwaOk =
      line.qiwaWage != null && Number.isFinite(Number(line.qiwaWage))
        ? Math.abs(expected - Number(line.qiwaWage)) < 1
        : false;
    return {
      employeeId: line.employeeId,
      employeeName: line.employeeName || "",
      nationalId: String(line.nationalId || "").trim(),
      iban: String(line.iban || "").trim().replace(/\s+/g, "").toUpperCase(),
      netPay: Math.round(Number(line.netPay || 0) * 100) / 100,
      qiwaMatch: qiwaOk,
      channel: "mudad",
    };
  });
}

export function checkWpsFileGate(rows) {
  const list = rows || [];
  if (!list.length) {
    return { ok: false, error: "WPS_EMPTY", reason: "لا صفوف لملف WPS.", reasonEn: "No rows for the WPS file." };
  }
  for (const row of list) {
    if (!/^\d{10}$/.test(row.nationalId)) {
      return {
        ok: false,
        error: "NATIONAL_ID_INVALID",
        employeeId: row.employeeId,
        reason: `هوية غير صالحة لـ ${row.employeeName || row.employeeId} — يلزم 10 أرقام.`,
        reasonEn: `Invalid national ID for ${row.employeeName || row.employeeId} — 10 digits required.`,
      };
    }
    if (!/^SA\d{22}$/.test(row.iban)) {
      return {
        ok: false,
        error: "IBAN_INVALID",
        employeeId: row.employeeId,
        reason: `آيبان غير صالح لـ ${row.employeeName || row.employeeId} — صيغة SA + 22 رقمًا.`,
        reasonEn: `Invalid IBAN for ${row.employeeName || row.employeeId} — SA + 22 digits.`,
      };
    }
    if (!row.qiwaMatch) {
      return {
        ok: false,
        error: "QIWA_MISMATCH",
        employeeId: row.employeeId,
        reason: `عدم تطابق أجر قوى لـ ${row.employeeName || row.employeeId} — لا إرسال WPS/مدى.`,
        reasonEn: `Qiwa wage mismatch for ${row.employeeName || row.employeeId} — cannot send WPS/Mudad.`,
      };
    }
  }
  return { ok: true, channel: "mudad", rowCount: list.length };
}
