export const DEFAULT_SUBSCRIPTION_PLANS = [
  { slug: "free", nameAr: "المجانية", nameEn: "Free", monthlyPrice: 0, yearlyPrice: 0, currency: "USD", featuresAr: ["الميزات الأساسية", "إدارة فريق صغير", "تقارير أساسية"], featuresEn: ["Core features", "Small team management", "Basic reports"], active: true, freeNow: true, sortOrder: 0 },
  { slug: "starter", nameAr: "البداية", nameEn: "Starter", monthlyPrice: 49, yearlyPrice: 490, currency: "USD", featuresAr: ["إدارة الموظفين", "الحضور والمهام", "التقارير التشغيلية"], featuresEn: ["Employee management", "Attendance and tasks", "Operational reports"], active: true, freeNow: true, sortOrder: 1 },
  { slug: "professional", nameAr: "الاحترافية", nameEn: "Professional", monthlyPrice: 149, yearlyPrice: 1490, currency: "USD", featuresAr: ["جميع ميزات البداية", "الرواتب والمخزون", "التحليلات والتوقيع"], featuresEn: ["All Starter features", "Payroll and inventory", "Analytics and signing"], active: true, freeNow: true, sortOrder: 2 },
  { slug: "enterprise", nameAr: "المؤسسات", nameEn: "Enterprise", monthlyPrice: 249, yearlyPrice: 2490, currency: "USD", featuresAr: ["جميع ميزات الاحترافية", "تشغيل متعدد المحطات", "دعم مؤسسي متقدم"], featuresEn: ["All Professional features", "Multi-station operations", "Advanced enterprise support"], active: true, freeNow: true, sortOrder: 3 },
];

export const planDisplayName = (plan, lang) => lang === "ar" ? plan.nameAr : plan.nameEn;
export const planFeatures = (plan, lang) => lang === "ar" ? plan.featuresAr : plan.featuresEn;