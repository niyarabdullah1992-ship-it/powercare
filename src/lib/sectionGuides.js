// Per-section usage guides shown at the top of every app page (SectionGuide).
// Arabic + English; other languages fall back to English.
const GUIDES = {
  "/app": {
    ar: ["هذه لوحة التحكم — نظرة شاملة على شركتك في شاشة واحدة.", "اقرأ «الملخص الذكي لليوم» أعلى الصفحة لمعرفة أهم ما يحتاج انتباهك.", "تابع «الاقتراحات الذكية» واضغط على أي اقتراح للانتقال مباشرة لمعالجته.", "البطاقات الرقمية تعرض نسبة الحضور والمهام المكتملة وحالة الفريق لحظيًا."],
    en: ["This is your dashboard — your whole company at a glance.", "Read the Smart Brief at the top for what needs attention first.", "Tap any Smart Suggestion to jump straight to fixing it.", "The stat cards show live attendance, task completion and team status."],
  },
  "/app/executive": {
    ar: ["هذه لوحة الإدارة العليا لقراءة وضع الشركة كاملًا.", "راجع مؤشرات الأداء والحضور والمخاطر، ثم قارن المحطات في الجدول والخريطة.", "افتح المحطة التي تحتاج تدخلًا وانتقل إلى القسم التشغيلي المرتبط لاتخاذ الإجراء."],
    en: ["This is the leadership view of the whole company.", "Review performance, attendance and risk, then compare stations in the table and map.", "Open a station requiring attention and continue to the related operational section."],
  },
  "/app/daily-report": {
    ar: ["هنا تُراجع التقارير اليومية المرسلة من الموظفين.", "اضغط «موافقة» أو «رفض» على كل تقرير معلق.", "استخدم أزرار التصدير لطباعة التقرير أو حفظه PDF/Excel."],
    en: ["Review the daily reports submitted by employees here.", "Approve or reject each pending report.", "Use the export buttons to print or save as PDF/Excel."],
  },
  "/app/tasks": {
    ar: ["يعمل التنظيم بتسلسل ثابت: المحطة ← القسم ← المهام؛ اختر المحطة أولًا.", "أنشئ قسمًا باسم واضح واضغط «حفظ»، ثم افتح القسم لإضافة مهمة داخله.", "يمكن نقل المهمة إلى قسم آخر بالسحب، ولا يمكن حذف قسم ما دام يحتوي على مهام نشطة.", "يسجل الموظف الإنجاز ويرفق الإثبات عند اكتمال الهدف، ثم يراجع المدير النتيجة."],
    en: ["Work follows a fixed structure: Station → Section → Tasks; choose a station first.", "Create and save a clearly named section, then open it to add a task.", "Tasks can be dragged between sections; a section with active tasks cannot be deleted.", "Employees log progress and attach final proof for manager review."],
  },
  "/app/attendance": {
    ar: ["سجّل حضورك بزر «تسجيل حضور» — قد يُطلب تحديد موقعك للتحقق من وجودك في المقر.", "المدير يتابع حضور الفريق اليومي والتقرير الشهري من التبويبات بالأعلى.", "من «الإعدادات» حدد مواقع المقرات على الخريطة ونطاق المسافة المسموح ووقت الدوام.", "تبويب «خريطة المواقع» يعرض أماكن تسجيل الحضور على الخريطة."],
    en: ["Check in with the “Check In” button — GPS may be requested to verify you're on site.", "Managers track daily attendance and monthly reports from the tabs above.", "In Settings, set workplace locations, allowed radius and work hours.", "The Location Map tab shows where check-ins happened."],
  },
  "/app/planner": {
    ar: ["أضف عناصر يومك مع وقت لكل عنصر، وعلّم عليها عند الإنجاز.", "اكتب يومك بجملة واحدة في مربع «خطط يومك مع نيرو» وسيبني لك جدولًا كاملاً.", "ستصلك تذكيرات قبل موعد كل عنصر."],
    en: ["Add your day's items with a time for each, and tick them off as you finish.", "Describe your day in one sentence in the Niro box and it builds your schedule.", "You'll get reminders before each item starts."],
  },
  "/app/journal": {
    ar: ["اكتب تقرير يومك بحرية واختر حالتك المزاجية.", "احفظ التقرير ليُضاف إلى سجل حياتك بالأسفل.", "صدّر سجلك كاملًا PDF أو Excel من أزرار التصدير."],
    en: ["Write freely about your day and pick your mood.", "Save it to add it to your life log below.", "Export your full log as PDF or Excel."],
  },
  "/app/calendar": {
    ar: ["التقويم يجمع خططك ويومياتك وزياراتك في مكان واحد.", "اضغط على أي يوم لعرض تفاصيله الكاملة."],
    en: ["The calendar gathers your plans, journal and visits in one place.", "Tap any day to see its full details."],
  },
  "/app/chat": {
    ar: ["اختر محطة أو المجموعة العامة من القائمة لبدء المحادثة.", "أرسل نصوصًا أو ملفات أو تسجيلات صوتية.", "استخدم البحث للعثور على رسائل قديمة، وتبويب «الملفات والوسائط» لكل ما تمت مشاركته."],
    en: ["Pick a station or the general room from the list to start chatting.", "Send text, files or voice notes.", "Use search for old messages, and the Files & Media tab for everything shared."],
  },
  "/app/files": {
    ar: ["أنشئ مجلدات (حتى داخل مجلدات أخرى) بزر «مجلد جديد».", "ارفع أي ملف داخل المجلد الحالي بزر «رفع ملف».", "اضغط على مجلد للدخول إليه، وعلى الملف لتنزيله."],
    en: ["Create folders (even inside folders) with “New Folder”.", "Upload any file into the current folder.", "Tap a folder to open it, a file to download it."],
  },
  "/app/inventory": {
    ar: ["أنشئ الأصناف واختر التتبع بالكميات أو برقم تسلسلي لكل قطعة.", "يطلب الموظف المادة أولًا، ثم يعتمد المشرف الطلب قبل الصرف.", "عند الصرف اختر الطلب المعتمد وامسح QR بالكاميرا؛ تُسجل الحركة تلقائيًا.", "استخدم سجل الحركة للاستلام والإرجاع والتحويل بين المحطات ومراقبة الحد الأدنى."],
    en: ["Create items and choose quantity or per-unit serial tracking.", "Employees request material first; supervisors approve before issue.", "For issue, select the approved request and scan its QR code; movement is recorded automatically.", "Use movements for receipts, returns and station transfers, and monitor minimum stock."],
  },
  "/app/expenses": {
    ar: ["أدخل نوع المصروف وبيانات الفاتورة قبل الضريبة والضريبة والكمية عند الحاجة.", "ارفع الإيصال كصورة أو PDF، ثم اختر المحطة أو المحطات المرتبطة بالمصروف.", "يراجع مدير النطاق الطلب أولًا، وبعد اعتماده تنتقل المطالبة للمراجعة المالية النهائية.", "تابع الحالة من سجل المصروفات واستخدم التصدير لإعداد التقرير."],
    en: ["Enter the expense type, pre-tax invoice amount, tax and quantity when applicable.", "Upload the receipt as an image or PDF, then choose the related station or stations.", "The scope manager reviews first; approved claims then move to final finance review.", "Track status in the expense ledger and use export to prepare reports."],
  },
  "/app/signing": {
    ar: ["احفظ توقيعك مرة واحدة (كتابة أو رسمًا) — يحصل على رقم تحقق مشفّر فريد.", "من «وقّع وأرسل» ارفع مستندًا وحدد مكان التوقيع وأرسله بالبريد لأي شخص.", "لتواقيع عدة أطراف استخدم «طلب تواقيع متعددة» — كل طرف يوقّع من رابط خاص به.", "تحقق من صحة أي مستند موقّع برقم التحقق من بطاقة «التحقق من مستند»."],
    en: ["Save your signature once (typed or drawn) — it gets a unique encrypted ID.", "Use Sign & Send: upload a document, place your signature, email it to anyone.", "For multiple parties use Multi-Sign — each signer gets their own link.", "Verify any signed document with its verification ID."],
  },
  "/app/complaints": {
    ar: ["قدّم شكوى أو اقتراحًا أو بلاغ خطر — اختر «مجهول» لحماية هويتك بالكامل.", "تابع ردود الإدارة على بلاغاتك في نفس الصفحة.", "غير مقتنع بالرد؟ صعّد البلاغ للمستوى الأعلى في سلسلة التصعيد."],
    en: ["File a complaint, suggestion or risk report — choose anonymous to fully protect your identity.", "Track management replies on this page.", "Not convinced? Escalate one level up the chain."],
  },
  "/app/employees": {
    ar: ["هذا القسم يجمع المحطات والموظفين؛ افتح محطة لإدارة بياناتها وفريقها في مكان واحد.", "أضف محطة وحدد موقعها ونطاق الحضور، ثم أضف الموظفين أو انقلهم إليها.", "يمكن تعديل اسم المحطة واسم الموظف مباشرة، مع بقاء التحليلات والمصروفات وإعدادات الموقع داخل المحطة."],
    en: ["This section combines stations and employees; open a station to manage its details and team together.", "Add a station and set its location and attendance radius, then add or move employees into it.", "Rename stations and employees directly while retaining analytics, expenses and location settings."],
  },
  "/app/hr": {
    ar: ["ابنِ هرم الموارد البشرية: أضف مناصب وحدد نطاق كل منصب (محطة/مجموعة/شركة).", "أنشئ مجموعات (Clusters) لمشرفين يغطون عدة محطات.", "هذا الهرم هو نفسه سلسلة التصعيد للشكاوى والاعتراضات في كل التطبيق."],
    en: ["Build your HR pyramid: add positions and set each one's scope.", "Create clusters for supervisors covering multiple stations.", "This pyramid is the escalation chain used across the whole app."],
  },
  "/app/performance": {
    ar: ["تابع ترتيب الأفراد والمحطات حسب النقاط المكتسبة من المهام المنجزة.", "استعرض تحليلات الإنتاجية وقارن بين الموظفين أو المحطات.", "عدّل قيم النقاط لكل أولوية من زر «قيم النقاط»."],
    en: ["Track individual and station rankings by points from completed tasks.", "Explore productivity analytics and compare employees or stations.", "Adjust point values per priority from the Points button."],
  },
  "/app/reports": {
    ar: ["اختر الفترة الزمنية لعرض تفصيل كامل لجميع المهام فيها.", "قارن بين الموظفين أو مجموعات المحطات من أدوات المقارنة.", "صدّر أي تقرير PDF أو Excel بألوان هوية شركتك."],
    en: ["Pick a time range for a full breakdown of all tasks in it.", "Compare employees or station groups with the comparison tools.", "Export any report as PDF or Excel with your company branding."],
  },
  "/app/assistant": {
    ar: ["اسأل نيرو سؤالًا محددًا مع ذكر المحطة والفترة عند الحاجة.", "يمكنه تلخيص البيانات والمقارنة وفتح الصفحات وتنفيذ الإجراءات المسموحة لدورك.", "راجع النتيجة والبيانات الحساسة قبل اعتماد أي مستند أو إجراء."],
    en: ["Ask Niro a specific question, including station and period when needed.", "It can summarize, compare, navigate and perform actions allowed for your role.", "Review results and sensitive data before approving a document or action."],
  },
  "/app/payroll": {
    ar: ["اختر الشهر لإنشاء أو فتح مسير الرواتب.", "راجع الأساسي والبدلات والمكافآت والخصومات وصافي كل موظف.", "عالج التحذيرات قبل اعتماد الدفع، ثم صدّر المسير أو القسائم عند الحاجة."],
    en: ["Choose a month to create or open its payroll run.", "Review salary, allowances, bonuses, deductions and net pay.", "Resolve warnings before approval, then export the run or payslips."],
  },
  "/app/safety": {
    ar: ["اختر المحطة ثم تنقل بين النظرة العامة والمؤشرات والمخاطر والفحوصات وتصاريح العمل.", "سجل الحوادث والمخاطر والإجراءات التصحيحية مع التاريخ والمسؤول.", "لا تعتمد الحالة الآمنة قبل استيفاء الفحص وإغلاق المخاطر المفتوحة، واستخدم الأرشيف والتصدير للمراجعة."],
    en: ["Choose a station, then use overview, KPIs, risks, checklists and work permits.", "Record incidents, risks and corrective actions with dates and owners.", "Complete inspections and close open risks before safe approval; use archive and export for review."],
  },
  "/app/help": {
    ar: ["تجد هنا شرحًا مرتبًا لجميع أقسام المنصة حسب تسلسل العمل.", "افتح الدليل التشغيلي الشامل للمزيد من التفاصيل أو للطباعة والحفظ PDF.", "استخدم زر «دليل القسم» الجانبي في أي صفحة لفتح إرشاداتها المختصرة."],
    en: ["Find an organized explanation of every platform section here.", "Open the complete operations manual for more detail or PDF printing.", "Use the side Section Guide button on any page for concise contextual instructions."],
  },
  "/app/manual": {
    ar: ["اختر الفصل المطلوب من فهرس الدليل للوصول مباشرة إلى شرحه.", "استخدم البحث للعثور على وظيفة أو إجراء محدد داخل المنصة.", "يمكنك طباعة الدليل أو حفظه PDF للرجوع إليه دون اتصال."],
    en: ["Choose a chapter from the manual contents to open its explanation.", "Use search to find a specific platform feature or procedure.", "Print the manual or save it as PDF for offline reference."],
  },
};

export function getGuide(pathname, lang) {
  const route = pathname.startsWith("/app/employees/")
    ? "/app/employees"
    : pathname.startsWith("/app/stations/") && pathname.endsWith("/expenses")
      ? "/app/expenses"
      : pathname;
  const guide = GUIDES[route];
  if (!guide) return null;
  return lang === "ar" ? guide.ar : guide.en;
}