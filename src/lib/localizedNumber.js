export function normalizeLocalizedNumber(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٬,\s]/g, "")
    .replace(/٫/g, ".")
    .replace(/[^0-9.]/g, "");
}