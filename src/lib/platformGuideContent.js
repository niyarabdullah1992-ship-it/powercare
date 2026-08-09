// Operations manual content — one chapter per platform module.
// Kept as plain data so the guide page stays presentational.

export const guideChapters = [
  {
    id: "dashboard",
    ar: { title: "لوحة التحكم", intro: "نقطة البداية اليومية: مؤشرات فورية، تنبيهات ذكية، وقائمة قرارات بانتظارك.", steps: ["راجع بطاقات المؤشرات لمعرفة حالة اليوم بلمحة.", "افتح التنبيهات التشغيلية لمعالجة المخاطر قبل تفاقمها.", "استخدم قائمة القرارات لاعتماد أو رفض الطلبات المعلّقة."] },
    en: { title: "Dashboard", intro: "Your daily starting point: live KPIs, smart alerts and a queue of decisions waiting on you.", steps: ["Scan the KPI cards for today's status at a glance.", "Open operational alerts to handle risks early.", "Use the decision queue to approve or reject pending items."] },
  },
  {
    id: "assistant",
    ar: { title: "المساعد نيرو", intro: "مساعد ذكي يقرأ بيانات شركتك ويجيب على أسئلتك التشغيلية.", steps: ["اكتب سؤالك بلغتك الطبيعية أو استخدم الأوامر الصوتية.", "أرفق صورة أو مستند لتحليله.", "اعتمد الإجراءات المقترحة قبل تنفيذها."] },
    en: { title: "Niro Assistant", intro: "An AI assistant that reads your company data and answers operational questions.", steps: ["Ask in natural language or use voice control.", "Attach an image or document for analysis.", "Approve suggested automations before they run."] },
  },
  {
    id: "tasks",
    ar: { title: "المهام", intro: "إنشاء وتوزيع ومتابعة المهام مع إثبات ميداني ونقاط أداء.", steps: ["أنشئ المهمة عبر المعالج وحدد المحطة والمكلفين والمدة.", "اضبط وزن الجهد والأولوية لاحتساب النقاط بعدالة.", "أرفق الأدلة عند الإغلاق واعتمد المهمة للمراجعة."] },
    en: { title: "Tasks", intro: "Create, assign and track tasks with field evidence and performance points.", steps: ["Create a task via the wizard: station, assignees and dates.", "Set effort weight and priority so points are fair.", "Attach evidence at closure and submit for review."] },
  },
  {
    id: "reports",
    ar: { title: "التقارير اليومية", intro: "تقرير يومي لكل وحدة مع حالة: مُرسل، متأخر، أو بدون نشاط.", steps: ["اختر اليوم من شريط التنقل الزمني.", "اضبط وقت الاستحقاق ليُحتسب التأخير بشكل صحيح.", "افتح قسم الوحدات غير النشطة لمراجعتها منفصلة."] },
    en: { title: "Daily reports", intro: "A daily report per unit with three states: reported, late, or idle.", steps: ["Pick the day from the timeline navigator.", "Set the due time so lateness is calculated correctly.", "Expand the idle units section to review them separately."] },
  },
  {
    id: "assets",
    ar: { title: "الأصول والعهد", intro: "سجل كامل للأصول مع العهدة، الصيانة، والفحص عبر رمز QR.", steps: ["سجّل الأصل ببياناته وصوره ومستنداته.", "نفّذ التسليم مع توقيع الطرفين وصور الحالة.", "وثّق الصيانة وأبلغ عن الفقد لفتح تحقيق موثق."] },
    en: { title: "Assets & custody", intro: "A full asset register with custody, maintenance and QR-based inspection.", steps: ["Register the asset with data, photos and documents.", "Hand over with dual signatures and condition photos.", "Log maintenance and report losses to open a documented case."] },
  },
  {
    id: "inventory",
    ar: { title: "المخزون", intro: "حركة المواد بين المستودعات والمحطات مع تتبع كامل للأرصدة.", steps: ["أضف الأصناف وحدّد الحد الأدنى للمخزون.", "سجّل الاستلام والصرف والتحويل والمشتريات.", "استخدم التقارير الدورية والتتبع لمعرفة مسار كل كمية."] },
    en: { title: "Inventory", intro: "Material movement across warehouses and stations with full balance tracing.", steps: ["Add items and set minimum stock levels.", "Record receipts, issues, transfers and purchases.", "Use period reports and tracing to follow every quantity."] },
  },
  {
    id: "safety",
    ar: { title: "السلامة (HSE)", intro: "تصاريح العمل، تقييم المخاطر، ومؤشرات السلامة لكل محطة.", steps: ["أصدر تصريح العمل واعتمده حسب التسلسل.", "سجّل الحوادث مع وصف الحدث والأثر.", "تابع مؤشرات الأداء وساعات العمل الآمنة."] },
    en: { title: "Safety (HSE)", intro: "Work permits, risk assessment and safety KPIs per station.", steps: ["Issue and approve work permits through the chain.", "Log incidents with what happened and the impact.", "Track KPIs and safe working hours."] },
  },
  {
    id: "hr",
    ar: { title: "الهيكل التنظيمي", intro: "بناء المستويات الإدارية والمحطات وربط الموظفين بها.", steps: ["أنشئ المستويات والمجموعات ثم اسحب الموظفين إليها.", "حدد مدراء المحطات وصلاحيات إدارة الفريق.", "راجع الخريطة الكاملة للتأكد من عدم وجود شواغر."] },
    en: { title: "Org structure", intro: "Build management tiers and stations, then link employees to them.", steps: ["Create tiers and clusters, then drag employees in.", "Assign station managers and team-management rights.", "Review the full map to catch unassigned people."] },
  },
  {
    id: "employees",
    ar: { title: "الموظفون", intro: "ملف كامل لكل موظف: البيانات، العقود، الشهادات، والصلاحيات.", steps: ["أضف الموظف وحدد دوره ومحطته ودرجته الوظيفية.", "ارفع العقد والشهادات وفعّل حساب الدخول.", "استخدم إنهاء الخدمة بعد تسليم كل العهد."] },
    en: { title: "Employees", intro: "A complete file per employee: data, contracts, certificates and access.", steps: ["Add the employee with role, station and job grade.", "Upload contract and certificates, enable login access.", "Offboard only after every asset is returned."] },
  },
  {
    id: "attendance",
    ar: { title: "الحضور والجدولة", intro: "تسجيل الحضور بالموقع الجغرافي مع جداول الورديات.", steps: ["حدد نطاق كل محطة على الخريطة.", "ابنِ جدول الورديات وعيّن الفرق.", "راجع التقرير الشهري وحالات التأخر والغياب."] },
    en: { title: "Attendance & scheduling", intro: "Geofenced check-in/out with full shift scheduling.", steps: ["Define each station's geofence on the map.", "Build the shift schedule and assign teams.", "Review the monthly report, lateness and absences."] },
  },
  {
    id: "leaves",
    ar: { title: "الإجازات والطلبات", intro: "طلبات الإجازة وطلبات الموارد البشرية واعتمادها.", steps: ["قدّم الطلب مع النوع والمدة والمرفقات.", "يعتمده المدير المباشر ثم الموارد البشرية.", "تابع الأرصدة المتبقية لكل موظف."] },
    en: { title: "Leaves & requests", intro: "Leave requests and HR requests with an approval chain.", steps: ["Submit with type, duration and attachments.", "The direct manager approves, then HR.", "Track remaining balances per employee."] },
  },
  {
    id: "performance",
    ar: { title: "الأداء", intro: "نقاط تُمنح من الخادم بمعادلة موحّدة مع سجل أدلة كامل.", steps: ["راجع لوحة الإنجازات ومقارنات المحطات.", "افتح سجل النقاط لمعرفة مصدر كل نقطة.", "استخدم تقارير الفترة لتقييم الفرق."] },
    en: { title: "Performance", intro: "Server-awarded points from a single equation with a full evidence trail.", steps: ["Review the achievements board and station comparisons.", "Open the points ledger to see the basis of every entry.", "Use period reports to evaluate teams."] },
  },
  {
    id: "payroll",
    ar: { title: "الرواتب", intro: "إعداد كشوف الرواتب وربطها بالحضور والبدلات.", steps: ["اضبط قالب الرواتب والبنود الثابتة.", "زامن بيانات الحضور للشهر.", "صدّر الكشف النهائي بصيغة Excel أو PDF."] },
    en: { title: "Payroll", intro: "Prepare payroll linked to attendance and allowances.", steps: ["Configure the payroll template and fixed items.", "Sync the month's attendance data.", "Export the final sheet as Excel or PDF."] },
  },
  {
    id: "expenses",
    ar: { title: "المصروفات", intro: "تسجيل مصروفات المحطات بالفواتير واعتمادها.", steps: ["سجّل المصروف وأرفق صورة الفاتورة.", "حدد المحطة وبند التصنيف.", "راجع تقرير الفترة لكل محطة."] },
    en: { title: "Expenses", intro: "Record station expenses with receipts and approvals.", steps: ["Record the expense and attach the receipt.", "Select the station and category.", "Review the period report per station."] },
  },
  {
    id: "signing",
    ar: { title: "توقيع المستندات", intro: "توقيع ذاتي أو جماعي مع ختم تحقق وسجل تدقيق غير قابل للتعديل.", steps: ["ارفع المستند وحدد مواضع التوقيع.", "أرسل الدعوات للموقعين بالتسلسل أو بالتوازي.", "تحقق من المستند النهائي عبر رقم التحقق."] },
    en: { title: "Document signing", intro: "Self or multi-party signing with a verification seal and immutable audit trail.", steps: ["Upload the document and place signature fields.", "Invite signers sequentially or in parallel.", "Verify the final file using its verification ID."] },
  },
  {
    id: "work-proof",
    ar: { title: "إثبات العمل", intro: "توثيق الأعمال الميدانية بصور قبل وبعد وتوقيع العميل.", steps: ["أنشئ الإثبات بالطاقم والمركبات وصور ما قبل العمل.", "أغلق العمل بصور ما بعد ويُختم توقيع الموظف تلقائيًا.", "أرسل رابط التوقيع للعميل واحفظ الشهادة."] },
    en: { title: "Work proof", intro: "Document field work with before/after photos and a client signature.", steps: ["Create the proof with crew, vehicles and before photos.", "Close it with after photos — the employee signature is stamped automatically.", "Email the signing link to the client and keep the certificate."] },
  },
  {
    id: "files",
    ar: { title: "الملفات", intro: "أرشيف مستندات الشركة مرتب بالمجلدات لكل محطة.", steps: ["أنشئ المجلدات حسب المحطة أو النوع.", "ارفع الملفات وأعد تسميتها عند الحاجة.", "شارك الملف مع الموقعين مباشرة."] },
    en: { title: "Files", intro: "A company document archive organized in folders per station.", steps: ["Create folders by station or type.", "Upload and rename files as needed.", "Send a file straight into a signing flow."] },
  },
  {
    id: "voice",
    ar: { title: "صوت الموظف", intro: "قناة بلاغات آمنة تصل للإدارة مع إمكانية إخفاء الهوية.", steps: ["أرسل البلاغ باسمك أو بشكل مجهول.", "تابع حالة بلاغك عبر الإيصال الخاص.", "تُصعّد البلاغات تلقائيًا عند عدم المعالجة."] },
    en: { title: "Employee voice", intro: "A safe reporting channel to management, optionally anonymous.", steps: ["Submit a report named or anonymously.", "Follow its status with your private receipt.", "Unhandled reports escalate automatically."] },
  },
];

export const guideMeta = {
  ar: { title: "الدليل التشغيلي لمنصة NiroVera", subtitle: "دليل محدّث يغطي جميع أقسام المنصة خطوة بخطوة", toc: "المحتويات", steps: "الخطوات", print: "طباعة / حفظ PDF" },
  en: { title: "NiroVera operations manual", subtitle: "An updated guide covering every platform module, step by step", toc: "Contents", steps: "Steps", print: "Print / Save as PDF" },
};