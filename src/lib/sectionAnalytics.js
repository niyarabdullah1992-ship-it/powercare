const routeDefinitions = [
  ["/app/daily-report", "Reports", "التقارير", (d) => d.reports],
  ["/app/tasks", "Tasks", "المهام", (d) => d.tasks],
  ["/app/attendance", "Attendance", "الحضور", (d) => d.personalAttendance],
  ["/app/chat", "Communications", "التواصل", (d) => d.notifications],
  ["/app/files", "Files", "الملفات", (d) => d.files],
  ["/app/inventory", "Inventory", "المخزون", (d, e) => e?.items],
  ["/app/expenses", "Expenses", "المصروفات", (d, e) => e?.claims],
  ["/app/signing", "Digital signing", "التوقيع الرقمي", (d) => d.files],
  ["/app/assistant", "Niro activity", "نشاط نيرو", (d) => d.notifications],
  ["/app/complaints", "Complaints", "الشكاوى", (d) => [...(d.anonymousReports || []), ...(d.publicReports || [])]],
  ["/app/employees", "Workforce", "القوى العاملة", (d) => d.employees],
  ["/app/stations", "Stations", "المحطات", (d) => d.stations],
  ["/app/hr", "HR structure", "الهيكل الإداري", (d) => d.hrLevels],
  ["/app/payroll", "Payroll", "الرواتب", (d) => d.payrollRuns?.at(-1)?.items],
  ["/app/performance", "Performance", "الأداء", (d) => d.tasks],
  ["/app/safety", "Safety", "السلامة", (d) => d.safety],
];

const dateOf = (row) => row.createdAt || row.created_at || row.created_date || row.updated_date || row.date || row.at || row.expenseDate;
const groupOf = (path, row) => {
  if (path.includes("employees")) return row.role || "unassigned";
  if (path.includes("files") || path.includes("signing")) return row.type || row.mimeType || "file";
  if (path.includes("inventory")) return Number(row.quantity || 0) <= Number(row.minimumStock || 0) ? "low stock" : "available";
  if (path.includes("payroll")) return row.paid ? "paid" : "unpaid";
  if (path.includes("chat") || path.includes("assistant")) return row.read ? "read" : "unread";
  if (path.includes("hr")) return row.scope || row.role || "level";
  return row.status || row.level || row.type || "active";
};
const attentionKeys = new Set(["rejected", "overdue", "red", "pending", "unread", "low stock", "open", "critical", "late", "absent"]);
const cleanLabel = (value) => String(value || "other").replaceAll("_", " ");

export function getSectionAnalytics(path, data = {}, externalData, lang) {
  const definition = routeDefinitions.find(([route]) => path === route || path.startsWith(`${route}/`));
  if (!definition) return null;
  const ar = lang === "ar";
  const rows = (definition[3](data, externalData) || []).filter(Boolean);
  const grouped = rows.reduce((map, row) => {
    const key = cleanLabel(groupOf(path, row));
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const categories = Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - index));
    return { key: `${date.getFullYear()}-${date.getMonth()}`, name: date.toLocaleDateString(ar ? "ar-SA" : "en", { month: "short" }), value: 0 };
  });
  rows.forEach((row) => {
    const date = new Date(dateOf(row));
    if (Number.isNaN(date.getTime())) return;
    const bucket = months.find((month) => month.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.value += 1;
  });
  const attention = rows.filter((row) => attentionKeys.has(cleanLabel(groupOf(path, row)).toLowerCase())).length;
  return {
    title: ar ? definition[2] : definition[1], categories, months,
    labels: ar ? { heading: "لوحة التحليل", total: "إجمالي السجلات", stable: "بحالة مستقرة", attention: "تحتاج متابعة", groups: "التصنيفات", distribution: "توزيع الحالات", trend: "اتجاه آخر 6 أشهر", empty: "لا توجد بيانات تحليلية بعد" } : { heading: "Analytics dashboard", total: "Total records", stable: "Stable records", attention: "Needs attention", groups: "Categories", distribution: "Status distribution", trend: "Last 6 months trend", empty: "No analytics data yet" },
    metrics: [rows.length, Math.max(0, rows.length - attention), attention, categories.length],
  };
}