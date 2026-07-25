import { detailedComparisonPages } from "@/lib/powerCareSapDetailedComparison";

export const comparisonPages = [
  {
    number: "01", eyebrow: "EXECUTIVE COMPARISON • 2026", title: "PowerCare مقابل أنظمة SAP التقليدية",
    intro: "مقارنة عملية بين منصة تشغيلية مرنة وبين منظومة مؤسسية عالمية عميقة. لا تفترض هذه الوثيقة أن أحد النظامين بديل كامل للآخر.",
    rows: [
      ["الخلاصة", "أسرع وأسهل للفرق الميدانية والشركات متعددة المواقع", "أعمق في المالية والحوكمة والعمليات العالمية", "تكامل لا استبدال"],
      ["نقطة القوة", "تحويل الهيكل المرئي إلى صلاحيات ومسارات تشغيل", "توحيد العمليات المؤسسية المعقدة على نطاق واسع", "لكل نظام دوره"],
      ["القرار الأنسب", "نظام تشغيل يومي مستقل مع موصلات اختيارية", "نظام السجل المالي والمؤسسي عند الحاجة", "استقلالية PowerCare"],
    ],
    note: "هذه مقارنة نوعية، وليست اختبار أداء مخبريًا أو مقارنة أسعار. تختلف تجربة SAP حسب المنتجات والإصدار والتخصيص وشريك التنفيذ."
  },
  {
    number: "02", eyebrow: "POWERCARE CAPABILITY MAP", title: "مميزات PowerCare من جميع الجوانب",
    intro: "القدرات التالية موجودة ضمن نطاق المنصة الحالي، ومصممة لتعمل في سياق واحد مترابط.",
    rows: [
      ["الهيكل والموارد البشرية", "شجرة مرنة، سحب وإعادة ترتيب، ملفات موظفين، درجات وصلاحيات", "Employee Central وهيكل مؤسسي واسع", "PowerCare أبسط بصريًا"],
      ["المحطات والميدان", "فرق ومواقع ونطاقات جغرافية ومؤشرات لكل محطة", "يتطلب نمذجة ووحدات وإعدادًا مناسبًا", "PowerCare أكثر تركيزًا"],
      ["الحضور والجداول", "حضور جغرافي، ورديات، استثناءات وتقارير", "حلول وقت وموارد بشرية مؤسسية", "حسب حجم وتعقيد الشركة"],
      ["المهام والتصعيد", "مهام وإثبات إنجاز وتصعيد مشتق من الشجرة", "سير عمل مؤسسي قابل للتكوين", "PowerCare مباشر"],
      ["الرواتب والمصروفات", "دورات مبسطة مرتبطة بالحضور والمحطات", "عمق محاسبي وضريبي وعالمي أكبر", "SAP أقوى مؤسسيًا"],
      ["المخزون والمشتريات", "أرصدة مواقع وحركات وطلبات وأوامر شراء", "Procure-to-pay وسلاسل إمداد عميقة", "SAP أوسع"],
      ["السلامة والامتثال", "تصاريح ومخاطر وحوادث وLTI حسب المحطة", "حوكمة وامتثال قابلان للتوسع", "PowerCare أقرب للميدان"],
      ["الوثائق والتوقيع", "مجلدات، توقيع متعدد الأطراف، بصمة وتحقق", "إدارة مستندات وتكاملات مؤسسية", "PowerCare موحّد"],
      ["الأمن والكاميرات", "مركز كاميرات وتنبيهات وربط بالمحطات", "ليس محور ERP التقليدي", "ميزة تخصصية لـPowerCare"],
      ["التحليلات والذكاء", "مركز قرار وتنبيهات ومساعد Niro", "تحليلات وذكاء مؤسسي واسع", "عمق مختلف"],
      ["اللغة والجوال", "عربي وRTL وتجربة ميدانية تعمل باللمس", "دعم عالمي يتفاوت حسب التطبيق", "PowerCare ملائم محليًا"],
    ]
  },
  ...detailedComparisonPages,
  {
    number: "03", eyebrow: "USABILITY • سهولة الاستخدام", title: "سهولة الاستخدام — Ease of Use",
    intro: "المعيار هو عدد الخطوات ووضوح الواجهة وسهولة التعلم. The measure is workflow clarity, number of steps, and learning effort.",
    rows: [
      ["بدء الاستخدام\nGetting started", "واجهة موحدة ونطاق واضح\nUnified interface and focused scope", "يتأثر بتعدد المنتجات والإعداد\nDepends on products and configuration", "PowerCare أبسط\nPowerCare is simpler"],
      ["منحنى التعلم\nLearning curve", "مصمم للمدير والموظف الميداني\nBuilt for managers and field staff", "غالبًا يحتاج تدريبًا حسب الدور\nOften requires role-based training", "أفضلية PowerCare\nPowerCare advantage"],
      ["تعديل الشجرة\nTree editing", "سحب بصري وتعديل مباشر\nVisual drag-and-drop editing", "إجراءات وبيانات رئيسية محكومة\nGoverned master-data procedures", "سرعة مقابل حوكمة\nSpeed vs governance"],
      ["الوصول للمعلومة\nFinding information", "الموظف والمحطة والعمل في سياق واحد\nPeople, sites, and work in one context", "قد تتوزع عبر تطبيقات ووحدات\nMay span multiple apps and modules", "PowerCare أبسط\nPowerCare is simpler"],
      ["الجوال والميدان\nMobile and field", "تجربة لمس موحدة للعمليات اليومية\nUnified touch-first daily workflows", "تجارب متعددة حسب منتج SAP\nExperience varies by SAP product", "PowerCare أكثر اتساقًا\nPowerCare is more consistent"],
      ["التخصيص\nCustomization", "تغييرات تشغيلية مركزة وسريعة\nFast, focused operational changes", "أوسع لكنه يحتاج خبرة وحوكمة\nBroader but needs expertise and governance", "يعتمد على الهدف\nDepends on the goal"],
      ["العربية وRTL\nArabic and RTL", "جزء أصيل من التجربة\nNative part of the experience", "متاح ويختلف حسب الحل\nAvailable; varies by solution", "PowerCare محليًا\nPowerCare locally"],
    ]
  },
  {
    number: "04", eyebrow: "SPEED & PERFORMANCE • السرعة والأداء", title: "سرعة الإنجاز والأداء — Speed & Performance",
    intro: "لا يوجد اختبار حمل موحد؛ المقارنة تقيس سرعة إنجاز العمل والتغيير. No controlled benchmark was performed; this compares workflow and change speed.",
    rows: [
      ["زمن الإطلاق\nTime to launch", "قصير نسبيًا لنطاق جاهز\nRelatively short for a ready scope", "أطول غالبًا بسبب النمذجة والتكامل\nOften longer due to modeling and integration", "PowerCare أسرع\nPowerCare is faster"],
      ["العمل اليومي\nDaily work", "خطوات قليلة للعمليات الميدانية\nFewer steps for field workflows", "يتأثر بالتكوين والأدوار\nDepends on configuration and roles", "PowerCare في نطاقه\nPowerCare in its scope"],
      ["تغيير الهيكل\nStructure changes", "تحديث مرئي مباشر\nDirect visual updates", "حوكمة بيانات واعتمادات\nData governance and approvals", "سرعة مقابل ضبط\nSpeed vs control"],
      ["التقارير التشغيلية\nOperational reports", "مؤشرات مباشرة من نفس السياق\nDirect indicators in one context", "قد تعتمد على طبقات بيانات\nMay rely on data layers", "PowerCare مباشر\nPowerCare is direct"],
      ["المعاملات الضخمة\nHigh-volume transactions", "لم يُثبت بعد على نطاق SAP العالمي\nNot yet proven at SAP's global scale", "مصمم لعمليات مؤسسية واسعة\nBuilt for large enterprise operations", "أفضلية SAP\nSAP advantage"],
      ["التوسع العالمي\nGlobal scale", "قابل للنمو ويحتاج اختبارات حمل\nScalable; needs further load evidence", "ناضج للكيانات والدول المعقدة\nMature for complex entities and countries", "أفضلية SAP\nSAP advantage"],
      ["سرعة التخصيص\nCustomization speed", "سريع للمتطلبات التشغيلية المركزة\nFast for focused operational needs", "أوسع لكنه يتطلب تصميمًا واختبارًا\nBroader, requiring design and testing", "PowerCare أسرع\nPowerCare is faster"],
    ]
  },
  {
    number: "05", eyebrow: "REALISTIC DECISION", title: "متى تختار كل نظام؟",
    intro: "الاختيار الصحيح يعتمد على المشكلة المراد حلها، وليس على عدد الخصائص فقط.",
    rows: [
      ["شركة متعددة المحطات", "اختيار قوي للتشغيل اليومي السريع", "مفيد إذا كانت لديها منظومة SAP قائمة", "PowerCare أولًا"],
      ["فرق ميدانية", "ملائم للحضور والمهام والسلامة والمخزون", "يحتاج تطبيقات أو تهيئة مكملة", "PowerCare أقرب"],
      ["مالية عالمية معقدة", "ليس بديلًا كاملًا حاليًا", "اختيار أقوى وأكثر نضجًا", "SAP"],
      ["امتثال دولي ورواتب متعددة الدول", "يحتاج تطويرًا وتحققًا حسب الدولة", "عمق وخبرة سوقية أكبر", "SAP"],
      ["سرعة واعتماد منخفض على الاستشاريين", "ميزة أساسية", "قد يعتمد على شركاء وخبراء", "PowerCare"],
      ["شركة تستخدم SAP بالفعل", "طبقة تشغيل ميدانية مكملة", "يبقى نظام السجل الأساسي", "تكامل ثنائي"],
      ["استقلالية المنتج", "يعمل دون SAP ويحافظ على قيمة PowerCare", "تكامل اختياري فقط", "الخيار الموصى به"],
    ],
    note: "التوصية: إبقاء PowerCare مستقلًا، وبيع تكامل SAP كإضافة مؤسسية يتحمل العميل تراخيص بيئتها وتكاليفها."
  },
  {
    number: "06", eyebrow: "METHODOLOGY & SOURCES", title: "المنهجية والمصادر",
    intro: "بُني جانب PowerCare على الوظائف الحالية في المنصة، وجانب SAP على الوصف الرسمي للمنتجات ووثائق التكامل المتاحة حتى يوليو 2026.",
    rows: [
      ["الهيكل والموارد", "SuccessFactors Employee Central وPerformance & Goals", "sap.com/products/hcm", "مصدر SAP رسمي"],
      ["المهام والأتمتة", "SAP Task Center وSAP Build Process Automation", "sap.com/products/technology-platform/process-automation", "مصدر SAP رسمي"],
      ["النقاط والمكافآت", "SuccessFactors Compensation يدعم برامج نقاط وتقدير", "sap.com/products/hcm/compensation-management", "مصدر SAP رسمي"],
      ["التوقيع الإلكتروني", "SAP Signature Management by DocuSign", "sap.com/products/technology-platform/electronic-signature-management", "مصدر SAP رسمي"],
      ["السلامة", "SAP S/4HANA for EHS وإدارة الحوادث", "sap.com/products/scm/safety-management-software", "مصدر SAP رسمي"],
      ["الحضور والجداول", "SuccessFactors وTime Management by WorkForce Software", "sap.com/products/hcm/workforce-management", "مصدر SAP رسمي"],
      ["المخزون", "Inventory Management للكمية والقيمة والحركات", "help.sap.com • Inventory Management", "مصدر SAP رسمي"],
      ["الكاميرات", "لم نجد مركز CCTV قياسيًا؛ الموجود وصول كاميرا جهاز أو تكاملات", "help.sap.com • SAP Build camera capabilities", "حد وظيفي معلن"],
      ["حدود المقارنة", "لا توجد قياسات حمل موحدة بين البيئتين", "الأحكام نوعية وليست Benchmark", "شفافية"],
    ],
    note: "تُراجع النتيجة لكل عميل بعد تحديد إصدار SAP، عدد المستخدمين، الدول، حجم المعاملات، والتكاملات المطلوبة."
  }
];