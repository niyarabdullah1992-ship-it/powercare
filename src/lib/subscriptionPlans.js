export const PLAN_SECTIONS = [
  { key: "assistant", ar: "المساعد الذكي", en: "AI Assistant" }, { key: "reports", ar: "التقارير", en: "Reports" },
  { key: "tasks", ar: "المهام", en: "Tasks" }, { key: "inventory", ar: "المخزون", en: "Inventory" },
  { key: "attendance", ar: "الحضور", en: "Attendance" }, { key: "hr", ar: "الموارد البشرية", en: "HR" },
  { key: "performance", ar: "الأداء", en: "Performance" }, { key: "expenses", ar: "المصروفات", en: "Expenses" },
  { key: "payroll", ar: "الرواتب", en: "Payroll" }, { key: "safety", ar: "السلامة", en: "Safety" },
  { key: "complaints", ar: "الشكاوى", en: "Complaints" }, { key: "files", ar: "الملفات", en: "Files" },
  { key: "signing", ar: "التوقيع", en: "Signing" }, { key: "chat", ar: "المحادثات", en: "Chat" },
];
export const PLAN_FEATURES = [{ key: "exports", ar: "تصدير PDF وExcel", en: "PDF & Excel exports" }, { key: "ai", ar: "الذكاء الاصطناعي", en: "AI tools" }, { key: "signing", ar: "التوقيع الرقمي", en: "Digital signing" }];
const CORE = ["tasks", "attendance", "chat", "files"];
const STARTER = [...CORE, "reports", "performance", "expenses", "complaints"];
const ALL = PLAN_SECTIONS.map((item) => item.key);

export const DEFAULT_SUBSCRIPTION_PLANS = [
  { slug: "free", nameAr: "المجانية", nameEn: "Free", monthlyPrice: 0, yearlyPrice: 0, currency: "USD", featuresAr: ["الميزات الأساسية", "إدارة فريق صغير", "تقارير أساسية"], featuresEn: ["Core features", "Small team management", "Basic reports"], maxStations: 1, maxEmployees: 5, enabledSections: CORE, enabledFeatures: [], active: true, freeNow: true, sortOrder: 0 },
  { slug: "starter", nameAr: "البداية", nameEn: "Starter", monthlyPrice: 49, yearlyPrice: 490, currency: "USD", featuresAr: ["إدارة الموظفين", "الحضور والمهام", "التقارير التشغيلية"], featuresEn: ["Employee management", "Attendance and tasks", "Operational reports"], maxStations: 5, maxEmployees: 30, enabledSections: STARTER, enabledFeatures: ["exports"], active: true, freeNow: true, sortOrder: 1 },
  { slug: "professional", nameAr: "الاحترافية", nameEn: "Professional", monthlyPrice: 149, yearlyPrice: 1490, currency: "USD", featuresAr: ["جميع ميزات البداية", "الرواتب والمخزون", "التحليلات والتوقيع"], featuresEn: ["All Starter features", "Payroll and inventory", "Analytics and signing"], maxStations: null, maxEmployees: null, enabledSections: ALL, enabledFeatures: ["exports", "ai", "signing"], active: true, freeNow: true, sortOrder: 2 },
  { slug: "enterprise", nameAr: "المؤسسات", nameEn: "Enterprise", monthlyPrice: 249, yearlyPrice: 2490, currency: "USD", featuresAr: ["جميع ميزات الاحترافية", "تشغيل متعدد المحطات", "دعم مؤسسي متقدم"], featuresEn: ["All Professional features", "Multi-station operations", "Advanced enterprise support"], maxStations: null, maxEmployees: null, enabledSections: ALL, enabledFeatures: ["exports", "ai", "signing"], active: true, freeNow: true, sortOrder: 3 },
];

export function normalizePlanConfig(plan) {
  const fallback = DEFAULT_SUBSCRIPTION_PLANS.find((item) => item.slug === plan?.slug) || (["custom", "individual"].includes(plan?.slug) ? DEFAULT_SUBSCRIPTION_PLANS[3] : DEFAULT_SUBSCRIPTION_PLANS[0]);
  return { ...fallback, ...plan, maxStations: plan?.maxStations === undefined ? fallback.maxStations : plan.maxStations, maxEmployees: plan?.maxEmployees === undefined ? fallback.maxEmployees : plan.maxEmployees, enabledSections: plan?.enabledSections || fallback.enabledSections, enabledFeatures: plan?.enabledFeatures || fallback.enabledFeatures };
}

export function planConfigForName(plans, name) {
  const key = String(name || "free").toLowerCase();
  const found = plans.find((plan) => plan.slug === key || String(plan.nameEn).toLowerCase() === key);
  return normalizePlanConfig(found || { slug: key });
}

export const planDisplayName = (plan, lang) => lang === "ar" ? plan.nameAr : plan.nameEn;
export const planFeatures = (plan, lang) => lang === "ar" ? plan.featuresAr : plan.featuresEn;