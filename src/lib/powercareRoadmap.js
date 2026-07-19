export const roadmapPhases = {
  ar: [
    { phase: "المرحلة 1", period: "الأسابيع 1–4", title: "الاستقرار والثقة", tone: "urgent", items: ["إصلاح OTP وتسليم البريد إلى Outlook وHotmail", "تثبيت Google OAuth وفصل الحساب الفردي عن حساب الشركة", "توحيد التوقيع الرقمي وجودة ختم PDF", "إصلاح تسجيل الانصراف أثناء الطوارئ ومزامنة الرواتب", "استعادة استجابة Niro وإضافة حدود أخطاء تمنع الشاشة البيضاء", "مراجعة Delta Sync وRLS وإضافة retry وrate limiting"] },
    { phase: "المرحلة 2", period: "الأشهر 1–3", title: "النمو والاحتفاظ", tone: "growth", items: ["لوحة مالك للإيرادات والمشتركين والتجديدات", "Push Notifications عبر Web Push وService Worker", "Niro أكثر موثوقية مع إنشاء تقارير PDF وتحليل أسبوعي", "Onboarding تفاعلي للشركات والمستخدمين الجدد", "تهيئة بديل OTP والإشعارات عبر WhatsApp أو SMS"] },
    { phase: "المرحلة 3", period: "الأشهر 3–6", title: "التميّز التنافسي", tone: "future", items: ["تقارير ESG وHSE قابلة للتصدير", "عروض أسعار مخصصة من لوحة المالك", "تصدير متوافق مع SAP وOracle", "تنبيهات Niro للأنماط التشغيلية غير الطبيعية", "تقييم موظفين 360 درجة في تقرير موحّد"] },
  ],
  en: [
    { phase: "Phase 1", period: "Weeks 1–4", title: "Stability & trust", tone: "urgent", items: ["Fix OTP delivery to Outlook and Hotmail", "Stabilize Google OAuth and separate account routes", "Unify digital signature state and PDF stamp quality", "Fix emergency checkout, payroll sync, and Niro responses", "Add React error boundaries and prevent blank screens", "Audit delta sync, RLS, retries, and authentication rate limits"] },
    { phase: "Phase 2", period: "Months 1–3", title: "Growth & retention", tone: "growth", items: ["Owner revenue, subscribers, and renewals analytics", "Web Push notifications through a Service Worker", "Reliable Niro PDF reports and weekly comparisons", "Interactive onboarding for new companies and users", "Prepare WhatsApp or SMS as an OTP alternative"] },
    { phase: "Phase 3", period: "Months 3–6", title: "Competitive edge", tone: "future", items: ["Exportable ESG and HSE reporting", "Custom quotations from the owner panel", "SAP and Oracle compatible exports", "Niro anomaly alerts for operational patterns", "Unified 360-degree employee reviews"] },
  ],
};

export const strengths = {
  ar: ["حضور GPS", "مهام متعددة المستويات", "توقيع رقمي", "مخزون صناعي", "مصروفات متعددة المراحل", "موارد بشرية هرمية", "دردشة وتقارير", "Niro AI", "9 لغات وRTL"],
  en: ["GPS attendance", "Multi-level tasks", "Digital signing", "Industrial inventory", "Multi-stage expenses", "Hierarchical HR", "Chat and reports", "Niro AI", "9 languages and RTL"],
};