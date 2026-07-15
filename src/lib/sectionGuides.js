// Per-section usage guides shown at the top of every app page (SectionGuide).
// Arabic + English; other languages fall back to English.
const GUIDES = {
  "/app": {
    ar: ["هذه لوحة التحكم — نظرة شاملة على شركتك في شاشة واحدة.", "اقرأ «الملخص الذكي لليوم» أعلى الصفحة لمعرفة أهم ما يحتاج انتباهك.", "تابع «الاقتراحات الذكية» واضغط على أي اقتراح للانتقال مباشرة لمعالجته.", "البطاقات الرقمية تعرض نسبة الحضور والمهام المكتملة وحالة الفريق لحظيًا."],
    en: ["This is your dashboard — your whole company at a glance.", "Read the Smart Brief at the top for what needs attention first.", "Tap any Smart Suggestion to jump straight to fixing it.", "The stat cards show live attendance, task completion and team status."],
  },
  "/app/daily-report": {
    ar: ["هنا تُراجع التقارير اليومية المرسلة من الموظفين.", "اضغط «موافقة» أو «رفض» على كل تقرير معلق.", "استخدم أزرار التصدير لطباعة التقرير أو حفظه PDF/Excel."],
    en: ["Review the daily reports submitted by employees here.", "Approve or reject each pending report.", "Use the export buttons to print or save as PDF/Excel."],
  },
  "/app/tasks": {
    ar: ["اضغط «مهمة جديدة» لإنشاء مهمة — النموذج يتذكر اختياراتك السابقة تلقائيًا.", "اختر المحطة ثم تنقّل بين المجلدات كأنها ملفات — اسحب مهمة وأفلتها داخل مجلد لنقلها.", "الموظف يسجّل إنجازه من زر «تسجيل المنجز» مع إرفاق إثبات إن طُلب.", "زر «الأرشيف الذكي» يعرض المهام المنتهية مصنفة حسب مدتها (سنوية/نصفية/ربعية/شهرية)."],
    en: ["Tap “New Task” — the form auto-fills your usual choices.", "Pick a station, then browse folders like files — drag a task onto a folder to move it.", "Employees log progress via “Log Completed”, attaching proof when required.", "The Smart Archive shows finished tasks grouped by duration."],
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
  "/app/signing": {
    ar: ["احفظ توقيعك مرة واحدة (كتابة أو رسمًا) — يحصل على رقم تحقق مشفّر فريد.", "من «وقّع وأرسل» ارفع مستندًا وحدد مكان التوقيع وأرسله بالبريد لأي شخص.", "لتواقيع عدة أطراف استخدم «طلب تواقيع متعددة» — كل طرف يوقّع من رابط خاص به.", "تحقق من صحة أي مستند موقّع برقم التحقق من بطاقة «التحقق من مستند»."],
    en: ["Save your signature once (typed or drawn) — it gets a unique encrypted ID.", "Use Sign & Send: upload a document, place your signature, email it to anyone.", "For multiple parties use Multi-Sign — each signer gets their own link.", "Verify any signed document with its verification ID."],
  },
  "/app/complaints": {
    ar: ["قدّم شكوى أو اقتراحًا أو بلاغ خطر — اختر «مجهول» لحماية هويتك بالكامل.", "تابع ردود الإدارة على بلاغاتك في نفس الصفحة.", "غير مقتنع بالرد؟ صعّد البلاغ للمستوى الأعلى في سلسلة التصعيد."],
    en: ["File a complaint, suggestion or risk report — choose anonymous to fully protect your identity.", "Track management replies on this page.", "Not convinced? Escalate one level up the chain."],
  },
  "/app/employees": {
    ar: ["أضف موظفًا بزر «إضافة موظف» وحدد درجته الوظيفية ومحطته.", "افتح ملف الموظف لتحديد كلمة مرور الدخول له من قسم «بيانات الدخول».", "اقرأ دليل «كيف تعمل الدرجات والصلاحيات» أسفل الصفحة لفهم الأدوار."],
    en: ["Add an employee and set their grade and station.", "Open their profile to set a login password under Login Access.", "See the roles guide at the bottom to understand permissions."],
  },
  "/app/stations": {
    ar: ["أضف محطة جديدة مع موقعها — اكتب اسم المدينة في البحث وستنتقل الخريطة إليها ثم اضغط النقطة الدقيقة.", "اسحب المحطات لإعادة ترتيبها، واضغط على محطة لعرض تحليلاتها.", "حدد نطاق المسافة المسموح لتسجيل الحضور حول كل محطة."],
    en: ["Add a station with its location — search a city name, the map flies there, then tap the exact spot.", "Drag stations to reorder; tap one for its analytics.", "Set the allowed check-in radius around each station."],
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
    ar: ["اسأل نيرو أي شيء عن شركتك: لخص التقارير، قارن المحطات، من الأفضل أداءً؟", "يمكنه تنفيذ إجراءات: إنشاء مهام، تصدير ملفات، فتح صفحات.", "جرّب الأسئلة المقترحة أسفل المحادثة للبدء."],
    en: ["Ask Niro anything about your company: summarize reports, compare stations, top performers.", "It can act too: create tasks, export files, open pages.", "Try the suggested questions to get started."],
  },
};

export function getGuide(pathname, lang) {
  const guide = GUIDES[pathname];
  if (!guide) return null;
  return lang === "ar" ? guide.ar : guide.en;
}