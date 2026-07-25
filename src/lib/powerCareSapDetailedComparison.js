export const detailedComparisonPages = [
  {
    number: "02A", eyebrow: "STRUCTURE & WORKFORCE • الهيكل والقوى العاملة", title: "الهيكل والموظفون والمحطات — Structure & Workforce",
    intro: "تفريق بين التجربة الجاهزة في PowerCare وبين ما يتطلب منتجات SAP HCM أو SuccessFactors وتهيئة إضافية.",
    rows: [
      ["الشجرة التنظيمية\nOrganization tree", "شجرة تشغيلية مرئية بالسحب\nVisual drag-and-drop operating tree", "هيكل تنظيمي قوي في SuccessFactors\nRobust structure in SuccessFactors", "كلاهما؛ PowerCare أبسط"],
      ["ربط الهيكل بالتشغيل\nStructure-to-work", "الصلاحيات والتصعيد والمحطات من الشجرة\nTree drives access, escalation, and sites", "ممكن عبر الأدوار وسير العمل والتهيئة\nPossible through roles, workflows, configuration", "PowerCare جاهز مباشرة"],
      ["ملف الموظف\nEmployee profile", "مهني، شهادات، إجازات، راتب وأداء\nCareer, certificates, leave, salary, performance", "قدرات Core HR أعمق عبر SuccessFactors\nDeeper Core HR through SuccessFactors", "SAP أعمق؛ PowerCare أوحد"],
      ["إدارة المحطات\nSite management", "محطة، مدير، فريق، موقع ومؤشرات\nSite, manager, team, location, KPIs", "تُمثّل بوحدات ومواقع ومراكز تكلفة\nModeled as units, locations, and cost centers", "PowerCare أكثر مباشرة"],
      ["الحضور الجغرافي\nGeofenced attendance", "مدمج مع نطاق كل محطة\nBuilt into each site's geofence", "الوقت والحضور متاحان؛ الجغرافيا تعتمد الحل\nTime is available; geofencing depends on solution", "PowerCare أصلي"],
      ["الجداول والورديات\nScheduling and shifts", "ورديات مرتبطة بالمحطة والحضور\nShifts tied to sites and attendance", "متاح عبر Workforce Management ومنتجات مرتبطة\nAvailable via workforce products", "SAP منتج أوسع"],
      ["الإجازات\nLeave management", "طلبات وأرصدة وموافقات\nRequests, balances, approvals", "متاح بعمق دولي في Employee Central\nDeep global support in Employee Central", "SAP أوسع دوليًا"],
      ["الحضور من الجوال\nMobile attendance", "تجربة لمس مباشرة للميدان\nDirect touch-first field flow", "متاح حسب تطبيق ومنتج الوقت\nAvailable by time product and app", "PowerCare أكثر اتساقًا"],
    ]
  },
  {
    number: "02B", eyebrow: "TASKS, POINTS & PERFORMANCE • المهام والنقاط والأداء", title: "المهام والأداء والمكافآت — Tasks & Performance",
    intro: "SAP يدعم هذه المجالات، لكن غالبًا عبر أكثر من منتج؛ PowerCare يجمعها داخل سياق تشغيلي واحد.",
    rows: [
      ["المهام اليومية\nDaily tasks", "تكليف، موعد، حالة، تعليقات وملفات\nAssignee, due date, status, comments, files", "مهام عبر التطبيقات وSAP Task Center\nTasks across apps and SAP Task Center", "كلاهما"],
      ["إثبات الإنجاز\nCompletion evidence", "صور وصوت وملفات ورفض وإعادة\nPhotos, audio, files, rejection and rework", "ممكن عبر نماذج وسير عمل مخصص\nPossible with forms and configured workflows", "PowerCare أصلي"],
      ["تنظيم المهام\nTask organization", "مجلدات وأقسام ومحطات مرنة\nFlexible folders, sections, and sites", "يعتمد على التطبيق أو تصميم العملية\nDepends on app or process design", "PowerCare أبسط"],
      ["التصعيد التلقائي\nAutomatic escalation", "مشتق مباشرة من ترتيب الشجرة\nDerived directly from tree order", "متاح عبر Build Process Automation\nAvailable via Build Process Automation", "PowerCare جاهز؛ SAP أوسع"],
      ["نقاط الموظف\nEmployee points", "نقاط مرتبطة بالإنجاز داخل الملف\nCompletion-linked points in the profile", "نقاط مكافآت عبر SuccessFactors Compensation\nPoints-based rewards via SuccessFactors Compensation", "كلاهما بنموذج مختلف"],
      ["تقييم الأداء\nPerformance reviews", "أداء مهام ونقاط ومقارنات شهرية\nTask, point, and monthly comparisons", "Performance & Goals أعمق في الأهداف والتقييم\nPerformance & Goals is deeper", "SAP أعمق"],
      ["الأهداف والتغذية الراجعة\nGoals and feedback", "مؤشرات تشغيلية وملاحظات مرتبطة بالعمل\nOperational indicators and work feedback", "أهداف مؤسسية ومحادثات أداء وذكاء\nEnterprise goals, reviews, and AI insights", "SAP أوسع"],
      ["المكافآت والتقدير\nRewards and recognition", "نقاط داخلية قابلة للتطوير\nInternal points model", "نقدي وغير نقدي وشكر ونقاط بمنتج مخصص\nCash, non-cash, thanks, and points", "SAP أعمق؛ ليس Core ERP وحده"],
    ]
  },
  {
    number: "02C", eyebrow: "CAMERAS & PHYSICAL SECURITY • الكاميرات والأمن", title: "الكاميرات والمراقبة — Cameras & Surveillance",
    intro: "الوصول لكاميرا جهاز أو التقاط صورة لا يساوي منصة إدارة كاميرات مراقبة وبث وتنبيهات.",
    rows: [
      ["سجل الكاميرات\nCamera registry", "كاميرات متعددة الموردين مرتبطة بالمحطات\nMulti-vendor cameras linked to sites", "ليس وظيفة ERP قياسية\nNot a standard ERP function", "PowerCare"],
      ["البث المباشر\nLive streaming", "مكوّن بث مع متطلبات بوابة متوافقة للمتصفح\nStreaming with browser-compatible gateway needs", "لا يوجد مركز CCTV أصلي في SAP التقليدي\nNo native CCTV hub in traditional SAP", "PowerCare؛ مع بنية بث"],
      ["اكتشاف الشبكة\nNetwork discovery", "فحص واكتشاف أجهزة مرشحة\nProbe and discover candidate devices", "ليس وظيفة قياسية\nNot standard", "PowerCare"],
      ["اختبار الاتصال\nConnection testing", "اختبار آمن من الخادم\nSecure server-side testing", "يحتاج تطبيقًا أو تكاملًا خارجيًا\nRequires custom app or external integration", "PowerCare"],
      ["تنبيهات الحركة\nMotion alerts", "Webhook وسجل تنبيهات وصلاحيات أمنية\nWebhook, alert log, and security access", "يحتاج نظام فيديو/IoT شريكًا وتكاملًا\nNeeds partner video/IoT system and integration", "PowerCare أصلي"],
      ["لقطات الحوادث\nIncident snapshots", "ربط اللقطة بالكاميرا والمحطة والحدث\nSnapshot linked to camera, site, and event", "ممكن بعد تكامل نظام المراقبة\nPossible after surveillance integration", "PowerCare مباشر"],
      ["كاميرا الجوال\nDevice camera", "تستخدم للرفع والإثبات والمسح\nUsed for uploads, evidence, and scanning", "SAP Build وتطبيقات SAP قد تصل لكاميرا الجهاز\nSAP apps can access device camera", "كلاهما؛ ليس CCTV"],
      ["الربط التشغيلي\nOperational context", "الكاميرا داخل سياق المحطة والتنبيه\nCamera sits inside site and alert context", "يُبنى عبر BTP/APIs وشركاء\nBuilt through BTP/APIs and partners", "PowerCare أوحد"],
    ],
    note: "حكم دقيق: SAP يمكنه التكامل مع الكاميرات، لكنه ليس نظام إدارة فيديو قياسيًا مثل مركز الكاميرات في PowerCare."
  },
  {
    number: "02D", eyebrow: "DOCUMENTS & SIGNATURES • المستندات والتوقيع", title: "الملفات والتوقيع الرقمي — Documents & E-signature",
    intro: "كلا النظامين يستطيعان دعم التوقيع، لكن نموذج المنتج والتنفيذ مختلف.",
    rows: [
      ["إدارة الملفات\nFile management", "مجلدات مرتبطة بالمحطات والعمل\nFolders linked to sites and work", "إدارة مستندات ومرفقات وسجلات مؤسسية\nEnterprise documents, attachments, records", "SAP أعمق؛ PowerCare أبسط"],
      ["التوقيع الذاتي\nSelf-signing", "مرسوم أو مكتوب داخل المنصة\nDrawn or typed inside the platform", "متاح في سيناريوهات أو حلول توقيع محددة\nAvailable in selected signature scenarios", "PowerCare مباشر"],
      ["عدة موقّعين\nMultiple signers", "تتابعي أو متوازٍ مع مواضع مستقلة\nSequential or parallel with placements", "SAP Signature Management by DocuSign\nSAP Signature Management by DocuSign", "كلاهما"],
      ["توقيع خارجي\nExternal signing", "رابط عام للموقّع دون دخول كامل\nPublic signer link without full login", "مدعوم عبر DocuSign والتكاملات\nSupported through DocuSign integrations", "كلاهما"],
      ["سجل التدقيق\nAudit trail", "أحداث الموقّعين والوقت والنسخة\nSigner, time, and version events", "قدرات امتثال وتدقيق حسب حل التوقيع\nCompliance and audit by signature solution", "كلاهما"],
      ["بصمة الملف\nFile fingerprint", "SHA-256 ومعرف تحقق عام\nSHA-256 and public verification ID", "التوقيع والامتثال يعتمدان على الحل المفعّل\nDepends on enabled signature solution", "PowerCare أصلي"],
      ["صفحة التحقق\nPublic verification", "تحقق عام من المعرف والبصمة\nPublic ID and fingerprint verification", "ليس نمطًا موحدًا عبر كل منتجات SAP\nNot uniform across all SAP products", "PowerCare مباشر"],
      ["التكلفة والترخيص\nLicensing", "ضمن نطاق منصة PowerCare\nWithin PowerCare platform scope", "غالبًا منتج/ترخيص DocuSign إضافي\nOften an additional DocuSign product/license", "يُراجع تجاريًا"],
    ]
  },
  {
    number: "02E", eyebrow: "FINANCE, STOCK & PROCUREMENT • المالية والمخزون", title: "الرواتب والمصروفات والمخزون — Finance & Supply",
    intro: "هنا تظهر قوة SAP التقليدية في العمق المالي وسلاسل الإمداد، مقابل بساطة PowerCare التشغيلية.",
    rows: [
      ["الرواتب\nPayroll", "قوالب وبدلات واستقطاعات وتقارير\nTemplates, allowances, deductions, reports", "رواتب وامتثال دولي أعمق\nDeeper global payroll and compliance", "SAP أعمق"],
      ["المصروفات\nExpenses", "إيصال وضريبة ومحطة واعتماد\nReceipt, tax, site, and approval", "SAP Concur وحلول مالية مؤسسية\nSAP Concur and enterprise finance", "SAP أوسع"],
      ["المخزون\nInventory", "رصيد لكل موقع وحركات ومسح QR\nPer-site balance, movements, QR scanning", "كمية وقيمة وتخطيط وسلاسل إمداد\nQuantity, value, planning, supply chain", "SAP أعمق"],
      ["التحويل والصرف\nTransfer and issue", "بين المستودع والمحطات والموظف والعمل\nWarehouse, site, employee, and work", "حركات مواد ومخازن متقدمة\nAdvanced material and warehouse movements", "كلاهما؛ SAP أوسع"],
      ["طلبات المواد\nMaterial requests", "طلب واعتماد وإصدار وتتبع تكلفة\nRequest, approval, issue, cost tracing", "متاح ضمن المشتريات والمخزون\nAvailable in procurement and inventory", "كلاهما"],
      ["أوامر الشراء\nPurchase orders", "طلبات وأوامر واستلام أساسي\nRequests, orders, and basic receiving", "Procure-to-pay وعقود وموردون بعمق\nDeep procure-to-pay, contracts, suppliers", "SAP أعمق"],
      ["الفواتير والضريبة\nInvoices and tax", "رفع فاتورة وحسابات تشغيلية\nInvoice upload and operational totals", "محاسبة وضريبة وتسوية ومدفوعات\nAccounting, tax, reconciliation, payments", "SAP بوضوح"],
      ["الإقفال المالي\nFinancial close", "ليس دفتر أستاذ عامًا كاملًا حاليًا\nNot a full general ledger today", "Record-to-report وإقفال مؤسسي\nEnterprise record-to-report and close", "SAP"],
    ]
  },
  {
    number: "02F", eyebrow: "HSE, AI & PLATFORM • السلامة والذكاء والمنصة", title: "السلامة والتحليلات والقدرات العامة — HSE & Platform",
    intro: "مقارنة القدرات المشتركة التي تمتد عبر أقسام الشركة.",
    rows: [
      ["السلامة HSE\nHealth and safety", "تصاريح ومخاطر وحوادث وLTI للمحطات\nPermits, risks, incidents, site LTI", "SAP S/4HANA for EHS أعمق في الامتثال\nSAP S/4HANA for EHS is deeper", "SAP أعمق؛ PowerCare ميداني"],
      ["البلاغات المجهولة\nAnonymous reporting", "قناة محمية مع متابعة خاصة\nProtected channel with private tracking", "يمكن بناؤها عبر حلول أو سير عمل\nCan be built through solutions/workflows", "PowerCare أصلي"],
      ["المحادثات\nWork chat", "مباشرة وجماعية ووسائط داخل السياق\nDirect, group, and media in context", "غالبًا عبر SAP Work Zone أو Microsoft Teams\nOften through Work Zone or Teams", "PowerCare أوحد"],
      ["الذكاء الاصطناعي\nAI", "Niro للوثائق والمخاطر والقرار\nNiro for documents, risk, and decisions", "SAP Business AI وJoule عبر المنتجات\nSAP Business AI and Joule across products", "كلاهما؛ SAP أوسع"],
      ["التحليلات\nAnalytics", "مركز قرار وتشغيل مباشر\nDirect operational decision center", "تحليلات مؤسسية وSAP Analytics Cloud\nEnterprise analytics and SAC", "SAP أعمق؛ PowerCare أسرع"],
      ["تعدد اللغات\nLanguages", "تسع لغات ودعم RTL\nNine languages with RTL", "دعم عالمي واسع حسب المنتج\nBroad global support by product", "SAP أوسع؛ PowerCare عربي أصيل"],
      ["سجل التدقيق\nAudit log", "إجراءات حساسة وتغييرات تشغيلية\nSensitive actions and operating changes", "حوكمة وتدقيق مؤسسي واسع\nBroad enterprise governance and audit", "SAP أعمق"],
      ["التكامل\nIntegration", "واجهات وWebhooks حسب الحاجة\nAPIs and webhooks as needed", "BTP Integration Suite وواجهات وحزم واسعة\nBTP Integration Suite, APIs, content", "SAP أوسع حاليًا"],
    ]
  }
];