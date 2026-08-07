// Per-section usage guides shown at the top of every app page (SectionGuide).
// Arabic + English; other languages fall back to English.
// Tone: Claude-calm steps, content: NiroVera Proof Cycle ideas.
const GUIDES = {
  "/app": {
    ar: [
      "لوحة المعلومات تعرض بهدوء ما يحتاج قرارًا الآن: مؤشرات، طلبات، حضور، وتنبيهات.",
      "دورة الإثبات تحت اللوحة: حضور → مهمة → اعتماد → ختم عميل.",
      "التفاصيل التشغيلية والتنبؤ متاحة أسفل الصفحة عند الحاجة — دون ازدحام أول شاشة.",
    ],
    en: [
      "The dashboard calmly shows what needs a decision now: KPIs, requests, attendance and alerts.",
      "The proof cycle sits under the board: attendance → task → approval → client seal.",
      "Deeper ops and foresight stay below the fold — so the first screen stays quiet.",
    ],
  },
  "/app/executive": {
    ar: ["هذه لوحة الإدارة العليا لقراءة وضع الشركة كاملًا.", "راجع مؤشرات الأداء والحضور والمخاطر، ثم قارن المحطات في الجدول والخريطة.", "افتح المحطة التي تحتاج تدخلًا وانتقل إلى القسم التشغيلي المرتبط لاتخاذ الإجراء."],
    en: ["This is the leadership view of the whole company.", "Review performance, attendance and risk, then compare stations in the table and map.", "Open a station requiring attention and continue to the related operational section."],
  },
  "/app/daily-report": {
    ar: ["التقرير اليومي يربط وردية اليوم بمسار الاعتماد.", "وافق أو ارفض التقارير المعلقة بسبب واضح.", "صدّر PDF/Excel بنفس الفلاتر الظاهرة أمامك."],
    en: ["Daily reports connect today’s shift to the approval path.", "Approve or reject pending reports with a clear reason.", "Export PDF/Excel with the same filters you see."],
  },
  "/app/tasks": {
    ar: [
      "المهام حلقة الإثبات الثانية: محطة ← قسم ← مهمة بوزن جهد.",
      "أنشئ قسمًا واضحًا ثم أضف مهمة؛ السحب ينقل بين الأقسام.",
      "الموظف يسجّل الإنجاز ويرفق إثباتًا وإقرارًا؛ المدير يعتمد أو يرفض بسبب مكتوب.",
      "التجاوز عن 75% من المدة مع إنجاز ضعيف يفعّل سلسلة التصعيد تلقائيًا.",
    ],
    en: [
      "Tasks are proof-cycle link two: Station → Section → effort-weighted task.",
      "Create a clear section, then add a task; drag moves between sections.",
      "Employees log progress with proof and attestation; managers approve or reject in writing.",
      "Past 75% of time with weak progress triggers automatic escalation.",
    ],
  },
  "/app/attendance": {
    ar: [
      "الحضور حلقة الإثبات الأولى: شخص + موقع + وقت.",
      "سجّل الحضور؛ قد يُطلب GPS للتحقق من المقر.",
      "المدير يتابع الفريق والتقرير الشهري — وهذه البيانات تغذّي المسير والمهام الميدانية.",
      "من الإعدادات حدّد مواقع المقرات ونطاق المسافة ووقت الدوام.",
    ],
    en: [
      "Attendance is proof-cycle link one: person + place + time.",
      "Check in; GPS may verify you are on site.",
      "Managers track the team and monthly report — this feeds payroll and field tasks.",
      "In Settings, set sites, radius and work hours.",
    ],
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
    ar: ["المستندات طبقة الثقة: أنشئ مجلدات وارفع الملفات المرتبطة بالموظف والعقود.", "ارفع أي ملف داخل المجلد الحالي.", "افتح المجلد أو نزّل الملف — ثم اربطه بالتوقيع أو إثبات العميل عند الحاجة."],
    en: ["Documents are the trust layer: create folders and upload files tied to people and contracts.", "Upload into the current folder.", "Open a folder or download a file — then link to signing or client proof when needed."],
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
    ar: [
      "التوقيع حلقة الاعتماد: احفظ توقيعك مرة ليأخذ رقم تحقق مشفّر.",
      "وقّع وأرسل مستندًا، أو اطلب تواقيع متعددة بترتيب الأدوار.",
      "تحقق من أي مستند موقّع برقم التحقق — مرتبط بإثبات العميل لاحقًا.",
    ],
    en: [
      "Signing is the approval link: save your signature once for an encrypted verify ID.",
      "Sign & send a document, or request multi-party signing in role order.",
      "Verify any signed file by ID — it later connects to client proof.",
    ],
  },
  "/app/client-proof": {
    ar: [
      "نهاية دورة الإثبات: اختر الأعمال المؤهلة وابنِ بطاقة إثبات للعميل.",
      "عطّل الحقول التي لا تُرسل قبل حساب البصمة.",
      "أصدر الإثبات بالختم التراثي وشارك رابط التحقق العام.",
    ],
    en: [
      "End of the proof cycle: pick eligible work and build a client proof card.",
      "Disable fields that must not be sent before the hash.",
      "Issue with the heritage seal and share the public verify link.",
    ],
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
    ar: ["ابدأ بالمحطة، ثم أضف مدير الموارد البشرية واجعله تابعًا لها داخل الشجرة.", "اختر محطة مدير HR وحدد مسماه وصلاحياته، ثم احفظه تحت المحطة.", "أضف المساعدين وموظفي التوظيف والرواتب والتدريب واجعل مدير HR مسؤولهم المباشر.", "يمكن وضع مشرف تحت مدير HR ثم ربط مجموعة من الموظفين بالمشرف.", "راجع سلسلة تصعيد الشكاوى بعد أي تغيير في التبعية."],
    en: ["Start with the station, then add the HR manager below it in the tree.", "Choose the HR manager station, title and permissions, then save below the station.", "Add assistants, recruiters, payroll and training employees below the HR manager.", "A supervisor can sit below the HR manager with employees reporting to that supervisor.", "Review complaint escalation after changing reporting lines."],
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
    ar: ["المسير يغذيه الحضور والطلبات ضمن دورة نيروفيرا.", "اختر الشهر وراجع الأساسي والبدلات والخصومات والصافي.", "عالج التحذيرات قبل الاعتماد، ثم صدّر المسير أو WPS."],
    en: ["Payroll is fed by attendance and requests inside the NiroVera cycle.", "Pick a month and review salary, allowances, deductions and net.", "Resolve warnings before approval, then export the run or WPS."],
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
  "/app/owner": {
    ar: [
      "لوحة المالك: المنشأة والباقة والتجديد — دون ضوضاء التشغيل اليومي.",
      "اربط قرارات الاشتراك بمؤشرات دورة الإثبات عبر اللوحة التنفيذية.",
    ],
    en: [
      "Owner panel: company, plan and renewal — without daily ops noise.",
      "Tie subscription decisions to proof-cycle metrics via the executive board.",
    ],
  },
};

export function getGuide(pathname, lang) {
  const route = pathname.startsWith("/app/employees/")
    ? "/app/employees"
    : pathname.startsWith("/app/stations/") && pathname.endsWith("/expenses")
      ? "/app/expenses"
      : pathname.startsWith("/app/client-proof")
        ? "/app/client-proof"
        : pathname;
  const guide = GUIDES[route];
  if (!guide) return null;
  return lang === "ar" ? guide.ar : guide.en;
}
