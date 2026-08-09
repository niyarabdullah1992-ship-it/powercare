// Shared status helpers for the employee directory screen.
import { isOnLeaveToday } from "@/lib/leaveTypes";

const EXPIRY_FIELDS = ["idExpiry", "workPermitExpiry", "passportExpiry", "medicalInsuranceExpiry"];

const daysFromNow = (value) => {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Number.isNaN(diff) ? null : Math.round(diff / 86400000);
};

export function expiringDocs(employee, withinDays = 30) {
  return EXPIRY_FIELDS.filter((key) => {
    const d = daysFromNow(employee?.profile?.[key]);
    return d !== null && d <= withinDays;
  });
}

export function isProbation(employee) {
  const d = daysFromNow(employee?.profile?.hireDate);
  return d !== null && d < 0 && d > -90;
}

export function hasNoSeat(employee) {
  return !(employee?.profile?.position || employee?.position) || !employee?.profile?.gradeId;
}

export function isOnDuty(employee) {
  return !isOnLeaveToday(employee);
}

export const EMPLOYEE_FILTERS = [
  { key: "onDuty", ar: "على رأس العمل", en: "On duty", match: isOnDuty },
  { key: "probation", ar: "تحت التجربة", en: "Probation", match: isProbation },
  { key: "noSeat", ar: "بلا مقعد", en: "No seat", match: hasNoSeat, alert: true },
  { key: "expiring", ar: "مستندات تنتهي خلال ٣٠ يوماً", en: "Docs expiring in 30d", shortAr: "مستندات منتهية قريباً", shortEn: "Docs expiring", match: (e) => expiringDocs(e).length > 0, alert: true },
];