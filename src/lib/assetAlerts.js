import moment from "moment";

// Rule 4 & 6 — inspection due within 7 days, warranty / useful life ending within 60 days.
export const INSPECTION_WARN_DAYS = 7;
export const EXPIRY_WARN_DAYS = 60;

export const daysUntil = (date) => (date ? moment(date).startOf("day").diff(moment().startOf("day"), "days") : null);

export const inspectionDue = (asset) => {
  const days = daysUntil(asset.nextInspectionDate);
  return days !== null && days <= INSPECTION_WARN_DAYS;
};

export const endOfLifeDate = (asset) => {
  if (!asset.purchaseDate || !asset.usefulLifeMonths) return null;
  return moment(asset.purchaseDate).add(Number(asset.usefulLifeMonths), "months").format("YYYY-MM-DD");
};

export const assetAlerts = (asset, lang = "ar") => {
  const alerts = [];
  const inspection = daysUntil(asset.nextInspectionDate);
  if (inspection !== null && inspection <= INSPECTION_WARN_DAYS) {
    alerts.push(inspection < 0
      ? (lang === "ar" ? `الفحص متأخر ${Math.abs(inspection)} يوم` : `Inspection overdue by ${Math.abs(inspection)} days`)
      : (lang === "ar" ? `الفحص خلال ${inspection} يوم` : `Inspection in ${inspection} days`));
  }
  const warranty = daysUntil(asset.warrantyEndDate);
  if (warranty !== null && warranty <= EXPIRY_WARN_DAYS) {
    alerts.push(lang === "ar" ? `الضمان ينتهي خلال ${Math.max(warranty, 0)} يوم` : `Warranty ends in ${Math.max(warranty, 0)} days`);
  }
  const eol = daysUntil(endOfLifeDate(asset));
  if (eol !== null && eol <= EXPIRY_WARN_DAYS) {
    alerts.push(lang === "ar" ? `العمر الافتراضي ينتهي خلال ${Math.max(eol, 0)} يوم` : `Useful life ends in ${Math.max(eol, 0)} days`);
  }
  return alerts;
};