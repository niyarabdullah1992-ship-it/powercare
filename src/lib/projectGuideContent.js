// Bilingual (AR/EN) explanatory guide content — one section per app area,
// each with an illustration. Rendered by src/pages/ProjectGuideDoc.jsx.

export const GUIDE_AUTHOR = {
  nameAr: "نيار عبدالله سويلم الرنياوي",
  nameEn: "NIYAR ABDULLAH SUWAILEM ALRANIAWI",
};

export const GUIDE_PROGRAM = {
  nameAr: "باور كير — PowerCare",
  nameEn: "PowerCare",
  taglineAr: "منصة سحابية متكاملة لإدارة الشركات والموارد البشرية والمهام",
  taglineEn: "An integrated cloud platform for company, HR and task management",
};

const IMG = {
  dashboard: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/3c83c65c5_generated_image.png",
  tasks: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/cbb47dce1_generated_image.png",
  chat: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/24732d25b_generated_image.png",
  attendance: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/ee0ce723d_generated_image.png",
  hr: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/9bbacd03c_generated_image.png",
  signing: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/09d46b0b4_generated_image.png",
  assistant: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/1dac196eb_generated_image.png",
  personal: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/2fa2c3798_generated_image.png",
  reports: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/33c9b16c5_generated_image.png",
  stations: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/4ccd0f2b5_generated_image.png",
  employees: "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/c346590d6_generated_image.png",
};

export const GUIDE_SECTIONS = [
  {
    image: IMG.dashboard,
    titleAr: "لوحة التحكم الرئيسية",
    titleEn: "Main Dashboard",
    bodyAr: [
      "لوحة التحكم هي أول ما يراه المستخدم بعد تسجيل الدخول، وهي تتكيّف تلقائيًا مع دور المستخدم: فالمالك والمدير التنفيذي يريان صورة شاملة للشركة كلها، بينما يرى مدير المحطة بيانات محطته فقط، ويرى الموظف العادي مهامه وحضوره الشخصي، أما حساب «الفرد» فيحصل على لوحة إنتاجية شخصية مستقلة.",
      "تعرض اللوحة بطاقات إحصائية فورية: عدد الموظفين، والمحطات النشطة، والمهام الجارية والمتأخرة، ونسب الحضور اليومية، مع رسم بياني لاتجاه الحضور خلال الأيام الماضية. وتتضمن لوحة «الإجراءات المعلّقة» التي تجمع كل ما يحتاج قرارًا من المدير في مكان واحد: طلبات إجازة، وشهادات بانتظار الاعتماد، ومهام بانتظار مراجعة الإنجاز.",
      "كما تضم اللوحة خريطة تفاعلية تُظهر مواقع جميع المحطات تلقائيًا (من الإحداثيات أو اسم المدينة المسجل)، وملخصًا يوميًا ذكيًا يولّده الذكاء الاصطناعي يلخّص أهم ما حدث في الشركة، وتنبيهات ذكية استباقية تنبه المدير لأي خلل قبل أن يتفاقم.",
    ],
    bodyEn: [
      "The dashboard is the first screen after login, and it automatically adapts to the user's role: the owner and director see a company-wide overview, a station manager sees only their station's data, a regular employee sees their own tasks and attendance, and Individual accounts get a dedicated personal productivity dashboard.",
      "It shows live stat cards — employee count, active stations, running and overdue tasks, and daily attendance rates — with an attendance trend chart for recent days. A Pending Actions panel gathers everything awaiting a manager's decision in one place: leave requests, certificates awaiting approval, and task completions awaiting review.",
      "The dashboard also includes an interactive map that automatically plots every station's location (from stored coordinates or city names), an AI-generated smart daily summary of the company's key events, and proactive smart alerts that warn managers about issues before they escalate.",
    ],
  },
  {
    image: IMG.stations,
    titleAr: "المحطات (مقرات العمل)",
    titleEn: "Stations (Work Sites)",
    bodyAr: [
      "قسم المحطات هو سجل مقرات العمل في الشركة: لكل محطة اسم وموقع ونوع (كهرباء/مياه/غيره) وحالة تشغيلية (نشطة/صيانة) ومدير مسؤول. يمكن إضافة عدد غير محدود من المحطات وتعديلها أو حذفها في أي وقت.",
      "الميزة الجوهرية هي تحديد الموقع الجغرافي الدقيق لكل محطة على خريطة تفاعلية: يبحث المدير عن العنوان أو ينقر على الخريطة مباشرة، ثم يحدد «نطاق المسافة المسموح» بالأمتار حول المقر. هذا النطاق هو ما يُستخدم لاحقًا للتحقق من حضور الموظفين — فلا يُقبل تسجيل حضور من خارج الدائرة المحددة.",
      "يمكن تعيين موظف واحد مديرًا لعدة محطات في آن واحد، وتعرض كل محطة تحليلات خاصة بها: عدد موظفيها، ومهامها الجارية، ونسب إنجازها، وسجل السلامة الخاص بها.",
    ],
    bodyEn: [
      "The Stations section is the registry of the company's work sites: every station has a name, location, type (power/water/other), operational status (active/maintenance) and a responsible manager. Stations can be added, edited or removed without limit.",
      "The core feature is pinning each station's precise GPS location on an interactive map: the manager searches for an address or clicks the map directly, then sets an allowed radius in meters around the site. This radius is what later verifies employee check-ins — attendance is rejected outside the defined circle.",
      "One employee can manage several stations at once, and each station shows its own analytics: its staff count, running tasks, completion rates and safety record.",
    ],
  },
  {
    image: IMG.employees,
    titleAr: "الموظفون والملفات الوظيفية",
    titleEn: "Employees & Profiles",
    bodyAr: [
      "سجل شامل لكل موظفي الشركة بأدوارهم المختلفة: مالك، مدير عمليات، مدير برامج، مدير محطة، وموظف. لكل موظف ملف وظيفي كامل على نمط أنظمة SAP يشمل: البيانات المهنية، والمسمى الوظيفي، والراتب، والشهادات والمؤهلات (مع دورة اعتماد: رفع → مراجعة → قبول/رفض)، وأرصدة الإجازات بأنواعها.",
      "يملك كل موظف حساب دخول خاصًا به (بريد إلكتروني وكلمة مرور مع رمز تحقق OTP إلزامي)، ويستطيع المدير إنشاء الحسابات وإعادة تعيين كلمات المرور وحذف الحسابات. ويمكن تقييد إضافة الموظفين على نطاق بريد الشركة فقط (مثل ‎@company.com).",
      "يتضمن القسم نظام نقاط تحفيزيًا: يمنح المديرون نقاطًا للموظفين المتميزين مع سبب المنح، وتظهر النقاط في ملف الموظف ولوحات الأداء، كما يعرض الملف حالة التواجد اللحظية (متصل/مشغول/في مكالمة) التي يحددها الموظف بنفسه.",
    ],
    bodyEn: [
      "A complete registry of all company staff across roles: owner, operations manager, program manager, station manager and employee. Every employee has a full SAP-style profile: professional information, job title, salary, certificates and qualifications (with an approval cycle: upload → review → approve/reject), and leave balances by type.",
      "Each employee has their own login account (email and password with mandatory OTP verification). Managers can create accounts, reset passwords and delete accounts, and employee registration can be restricted to the company's email domain (e.g. @company.com).",
      "The section includes a motivational points system: managers award points to outstanding employees with a stated reason, visible on the profile and performance boards, and profiles show a live presence status (online/busy/on a call) set by the employee.",
    ],
  },
  {
    image: IMG.tasks,
    titleAr: "المهام والأهداف",
    titleEn: "Tasks & Targets",
    bodyAr: [
      "نظام مهام هرمي مرن: ينشئ المدير «هدفًا» محددًا بعدد مهام ومدة زمنية (أو نطاق تواريخ مخصص)، ويسنده إلى موظف بعينه أو إلى فريق محطة كاملة أو فريق المقر الرئيسي، مع أولوية (منخفضة/متوسطة/عالية) وخطوات تفصيلية وملفات مرفقة.",
      "تُنظَّم المهام داخل مجلدات وأقسام ينشئها المستخدم بنفسه لكل محطة — بنية تصفح على نمط المجلدات يتنقل فيها من المحطة إلى القسم إلى المهمة، مع إمكانية إعادة الترتيب وإعادة التسمية. ويصنّف «الأرشيف الذكي» المهام المكتملة حسب مدتها: سنوية، نصف سنوية، ربع سنوية، وشهرية.",
      "يسجّل الموظف تقدمه أولًا بأول، وعند بلوغ الهدف يُلزَم بإرفاق إثبات (صورة أو ملف) وتنتقل المهمة إلى «بانتظار المراجعة»؛ فيعتمدها المدير أو يرفضها مع ذكر السبب إلزاميًا، وللموظف حق الاعتراض على الرفض ويتصاعد اعتراضه تلقائيًا عبر السلسلة الإدارية. والمهام المتأخرة تُعلَّم تلقائيًا وتُرسَل بشأنها تنبيهات تصعيدية يومية دون تدخل بشري.",
    ],
    bodyEn: [
      "A flexible hierarchical task system: a manager creates a target defined by a task count and duration (or a custom date range), assigned to a specific employee, an entire station team or the HQ team, with a priority (low/medium/high), detailed steps and file attachments.",
      "Tasks are organized inside user-created folders and sections per station — folder-style navigation from station to section to task, with reordering and renaming. A Smart Archive classifies completed tasks by duration: annual, half-yearly, quarterly and monthly.",
      "Employees log progress as they work; on reaching the target they must attach proof (photo or file) and the task moves to pending review, where the manager approves or rejects it with a mandatory reason. The employee can dispute a rejection, and the dispute escalates automatically up the management chain. Overdue tasks are flagged automatically with daily escalation alerts sent without human intervention.",
    ],
  },
  {
    image: IMG.attendance,
    titleAr: "الحضور والانصراف بالموقع الجغرافي",
    titleEn: "GPS Attendance",
    bodyAr: [
      "الفكرة الجوهرية للمنصة: لا يُقبل تسجيل الحضور إلا إذا كان الموظف فعليًا داخل النطاق الجغرافي المحدد لمقر عمله. عند الضغط على «تسجيل حضور» يُقرأ موقع الجهاز بدقة عالية ويُقارن بإحداثيات المحطة المخزنة في الخادم — ولا يمكن التلاعب بالإحداثيات من جهة المستخدم لأن التحقق يتم في الخادم حصرًا.",
      "يشمل النظام: تسجيل حضور وانصراف يومي، وأعذار التأخر والغياب مع مرفقات، وجداول ورديات لكل محطة (صباحية/مسائية/ليلية قابلة للتخصيص) مع إسناد الموظفين لكل وردية في كل يوم من أيام الأسبوع، وتنبيهات تأخر تلقائية تُرسل للمدير، وتعليم الغائبين تلقائيًا نهاية اليوم عبر مهمة مجدولة.",
      "تُعرض البيانات في لوحة يومية حية، وخريطة تُظهر مواقع تسجيل الحضور، وتقرير شهري تفصيلي لكل موظف (أيام الحضور والغياب والتأخر) قابل للتصدير، وتحليلات اتجاهات تكشف أنماط الالتزام.",
    ],
    bodyEn: [
      "The platform's core idea: attendance is accepted only if the employee is physically inside the GPS radius defined for their work site. Pressing Check-In reads the device location at high accuracy and compares it against the station coordinates stored on the server — coordinates cannot be spoofed client-side because verification happens exclusively on the server.",
      "The system covers daily check-in/check-out, late and absence excuses with attachments, per-station shift schedules (customizable morning/evening/night shifts) with employee assignment per weekday, automatic late alerts sent to managers, and automatic end-of-day absentee marking via a scheduled job.",
      "Data is presented in a live daily dashboard, a map of check-in locations, a detailed exportable monthly report per employee (present/absent/late days), and trend analytics revealing commitment patterns.",
    ],
  },
  {
    image: IMG.hr,
    titleAr: "الموارد البشرية والهيكل الإداري",
    titleEn: "HR & Organizational Hierarchy",
    bodyAr: [
      "هيكل موارد بشرية مرن بالكامل: تبني الشركة سلّمها الإداري بنفسها بأي عدد من الدرجات (مثل: HR الموقع → HR المجموعة → رئيس العمليات → نائب الرئيس → CHRO)، ولكل درجة نطاق صلاحية (محطة واحدة، مجموعة محطات، أو الشركة كلها) وصلاحيات قابلة للتخصيص بندًا بندًا، مع إمكانية إضافة مساعد لكل درجة.",
      "يمكن إعادة ترتيب الدرجات وتعليقها مؤقتًا وحذفها، ويُعاد توجيه أي شكوى عالقة تلقائيًا عند حذف درجة. وتُجمَّع المحطات في «مجموعات» (Clusters) ليُشرف عليها مسؤول HR واحد.",
      "يدير القسم أيضًا طلبات الإجازات بأنواعها (سنوية، مرضية، طارئة...) بأرصدة قابلة للتعديل لكل موظف، ودورة اعتماد كاملة، إضافة إلى قناة تواصل HR لكل موظف تصل رسائلها إلى مسؤول HR المختص بمحطته تلقائيًا.",
    ],
    bodyEn: [
      "A fully flexible HR structure: each company builds its own ladder with any number of tiers (e.g. Site HR → Cluster HR → Head of Ops → VP → CHRO). Every tier has a scope (one station, a cluster of stations, or company-wide) and per-item customizable permissions, with an optional assistant per tier.",
      "Tiers can be reordered, temporarily suspended or deleted — any complaint stuck at a deleted tier is redirected automatically. Stations can be grouped into clusters overseen by a single HR officer.",
      "The section also manages leave requests of all types (annual, sick, emergency…) with adjustable balances per employee and a full approval cycle, plus a per-employee HR communication channel whose messages route automatically to the HR officer responsible for their station.",
    ],
  },
  {
    image: IMG.hr,
    titleAr: "الشكاوى والبلاغات مجهولة الهوية",
    titleEn: "Complaints & Anonymous Reports",
    bodyAr: [
      "قناة آمنة يرفع منها الموظف شكوى أو اقتراحًا أو بلاغ مخاطر دون كشف هويته: تُستبدل هوية المرسل برمز مجهول يُولَّد بتشفير أحادي الاتجاه غير قابل للعكس، ويتغيّر الرمز تلقائيًا كل 30 يومًا لمنع تتبع الأنماط.",
      "لكل بلاغ نوع (شكوى/اقتراح/بلاغ مخاطر) وأولوية (منخفضة/متوسطة/عالية) ومرفقات اختيارية. ويمر البلاغ بسلسلة تصعيد مرتبطة بالهيكل الإداري: يبدأ عند مدير المحطة، فإن لم يُحل يتصاعد درجة درجة حتى يصل أعلى درجة HR في الشركة، مع سجل ردود كامل في كل مستوى.",
      "ولمنع إساءة الاستخدام، يحدد المالك سقفًا لعدد البلاغات المسموح للموظف الواحد يوميًا وأسبوعيًا وشهريًا، وتظهر للموظف عداداته الحالية قبل الإرسال.",
    ],
    bodyEn: [
      "A safe channel where employees file complaints, suggestions or risk reports without revealing their identity: the sender's identity is replaced with an anonymous code generated by irreversible one-way hashing, rotating automatically every 30 days to prevent pattern tracking.",
      "Each report has a type (complaint/suggestion/risk report), a priority (low/medium/high) and optional attachments. Reports travel an escalation chain tied to the HR hierarchy: starting at the station manager and rising tier by tier until the company's top HR level, with a full reply log at every stage.",
      "To prevent abuse, the owner sets daily, weekly and monthly limits on reports per employee, and employees see their current counters before submitting.",
    ],
  },
  {
    image: IMG.chat,
    titleAr: "الدردشة والتواصل الداخلي",
    titleEn: "Chat & Internal Communication",
    bodyAr: [
      "نظام تواصل داخلي متكامل: لكل محطة غرفة دردشة عامة خاصة بها، وللمقر الرئيسي غرفته، ويستطيع المالك تفعيل غرفة موحدة لجميع المحطات أو إنشاء «مجموعات دردشة» تربط محطات مختارة معًا (مثل محطتي أ+ب في غرفة واحدة).",
      "إلى جانب الغرف العامة، تتوفر رسائل خاصة مباشرة بين أي موظفَين، مع دعم إرفاق الملفات والصور والرسائل الصوتية المسجلة. ويمكن حذف الرسالة خلال دقيقتين من إرسالها للجميع، وبعدها تُحذف من عرض المرسل فقط.",
      "تشمل كل محادثة تبويبات إضافية: معرض الملفات والوسائط المتبادلة، وبحث في الرسائل، ومُرسل بريد إلكتروني رسمي لمخاطبة الموظفين عبر بريد الشركة. وكل الغرف معزولة عزلًا صارمًا بين الشركات — لا تطّلع شركة على محادثات شركة أخرى إطلاقًا.",
    ],
    bodyEn: [
      "A complete internal communication system: every station has its own general chat room, HQ has its own, and the owner can enable one shared room for all stations or create chat groups linking selected stations together (e.g. stations A+B in one room).",
      "Beyond group rooms, direct private messages are available between any two employees, with file, photo and recorded voice-message attachments. A message can be deleted for everyone within two minutes of sending; afterwards it disappears only from the sender's view.",
      "Every conversation includes extra tabs: a shared files & media gallery, message search, and an official email composer for contacting staff via company email. All rooms are strictly isolated between companies — no company can ever see another company's conversations.",
    ],
  },
  {
    image: IMG.dashboard,
    titleAr: "الأداء والتحليلات",
    titleEn: "Performance & Analytics",
    bodyAr: [
      "قسم تحليلي يقيس أداء الأفراد والمحطات بالأرقام: نسب إنجاز المهام، وسرعة الاستجابة، وعدد المشكلات المبلغ عنها، والنقاط التحفيزية المكتسبة، مع شارات أداء ملونة توضح مستوى كل موظف في لمحة.",
      "يتيح القسم مقارنات مباشرة: موظف مقابل موظف، ومحطة مقابل محطة، ومجموعة مقابل مجموعة — برسوم بيانية تفاعلية تكشف نقاط القوة والضعف، مع تقرير فردي مفصل لكل موظف يصلح للتقييم السنوي.",
      "وتُعرض قائمة «المشكلات والتوقفات» المسجلة على المهام (تعطل معدات، نقص مواد...) مع أسبابها وتواريخها، لتساعد الإدارة على معالجة أسباب التعطل الجذرية.",
    ],
    bodyEn: [
      "An analytics section measuring individual and station performance in numbers: task completion rates, response speed, reported issues and earned reward points, with colored performance badges showing each employee's level at a glance.",
      "It offers direct comparisons — employee vs employee, station vs station, group vs group — through interactive charts revealing strengths and weaknesses, plus a detailed single-employee report suitable for annual evaluations.",
      "A list of issues and stoppages logged on tasks (equipment failure, material shortage…) is shown with causes and dates, helping management address root causes of downtime.",
    ],
  },
  {
    image: IMG.reports,
    titleAr: "التقارير ومركز التصدير",
    titleEn: "Reports & Export Center",
    bodyAr: [
      "يرفع الموظفون تقارير يومية عن ورديّاتهم تمر بدورة اعتماد (بانتظار المراجعة → معتمد)، ويجمع قسم التقارير كل بيانات الشركة في جداول قابلة للتصفية حسب المحطة والفترة الزمنية والموظف.",
      "يوفر «مركز التصدير» إخراج أي تقرير بصيغة PDF أنيقة أو Excel ملون، مع دعم كامل للغة العربية واتجاه الكتابة من اليمين لليسار. ويمكن للشركة رفع شعارها وتخصيص هويتها البصرية لتظهر على رأس كل تقرير مُصدَّر.",
      "كما تتوفر مقارنات تصديرية بين المجموعات، وتقرير أسبوعي تلقائي يُرسَل للمالك بالبريد الإلكتروني يلخص أداء الشركة، وتقارير موقعة رقميًا بشارة تحقق مشفرة تضمن عدم التلاعب بمحتواها بعد إصدارها.",
    ],
    bodyEn: [
      "Employees file daily shift reports that pass an approval cycle (pending review → approved), and the Reports section aggregates all company data into tables filterable by station, period and employee.",
      "The Export Center outputs any report as an elegant PDF or a colored Excel file, with full Arabic and right-to-left support. Companies can upload their logo and customize branding to appear on every exported report's header.",
      "Exportable group-vs-group comparisons are available, an automatic weekly summary is emailed to the owner, and digitally signed reports carry an encrypted verification badge guaranteeing the content cannot be tampered with after issuance.",
    ],
  },
  {
    image: IMG.reports,
    titleAr: "ملفات الشركة",
    titleEn: "Company Files",
    bodyAr: [
      "أرشيف مستندات مركزي للشركة بنظام مجلدات متداخلة بلا حدود: ينشئ المستخدم مجلدًا داخل مجلد بأي عمق، ويرفع المستندات بأي صيغة (PDF، صور، جداول...) مع حفظ اسم الرافع وتاريخ الرفع وحجم الملف.",
      "يمكن ربط الملف بمحطة محددة ليظهر في سياقها، وحذف أي مجلد يحذف تلقائيًا كل محتوياته المتداخلة مهما بلغ عمقها، مع رسالة تأكيد قبل الحذف تحمي من الحذف الخاطئ.",
      "تُخزَّن الملفات في التخزين السحابي وتبقى متاحة من أي جهاز، وتخضع لعزل الشركات الكامل — فملفات كل شركة مرئية لموظفيها فقط.",
    ],
    bodyEn: [
      "A central document archive with unlimited nested folders: users create folders inside folders at any depth and upload documents of any format (PDF, images, spreadsheets…) with the uploader's name, upload date and file size recorded.",
      "A file can be linked to a specific station to appear in its context. Deleting a folder automatically removes all nested contents at any depth, with a confirmation prompt protecting against accidental deletion.",
      "Files live in cloud storage, accessible from any device, and follow full company isolation — each company's files are visible to its own staff only.",
    ],
  },
  {
    image: IMG.signing,
    titleAr: "التوقيع الرقمي للمستندات",
    titleEn: "Digital Document Signing",
    bodyAr: [
      "نظام توقيع إلكتروني متكامل على نمط DocuSign: يسجل المستخدم توقيعه مرة واحدة — رسمًا بيده على لوحة رقمية أو كتابةً بخطوط توقيع أنيقة (منها خطوط عربية مثل «أريف رقعة») — فيحصل توقيعه على رقم تحقق مشفر فريد بصيغة PWC-XXXX-XXXX-XXXX مولّد بخوارزمية SHA-256 غير قابلة للعكس.",
      "عند توقيع مستند PDF أو صورة، يختار المستخدم موضع التوقيع بنفسه بالسحب على صفحة المستند (مع دعم تكبير التوقيع بإصبعين على الجوال)، وتُختَم الوثيقة بشارة تحقق تحمل الرقم المشفر ورمز QR، وتُسجَّل بصمة الملف النهائي (SHA-256) في سجل تحقق مركزي.",
      "ولتوقيع عدة أطراف: يرسل المنشئ طلب توقيع بالبريد الإلكتروني لأي أطراف خارجية — حتى غير المسجلين في المنصة — فيوقّع كل طرف من رابط خاص وآمن به وحده، وتُختم الوثيقة النهائية تلقائيًا بعد اكتمال الجميع ويُخطَر المنشئ. وصفحة «التحقق» العامة تتيح لأي جهة التأكد من صحة أي مستند موقّع: مطابقة الرقم وبصمة الملف تكشف فورًا أي تلاعب.",
    ],
    bodyEn: [
      "A complete DocuSign-style e-signing system: the user registers a signature once — drawn by hand on a digital pad or typed in elegant signature fonts (including Arabic fonts such as Aref Ruqaa) — and it receives a unique encrypted verification ID in the form PWC-XXXX-XXXX-XXXX, generated with irreversible SHA-256 hashing.",
      "When signing a PDF or image, the user freely places the signature by dragging it on the document page (with pinch-to-resize on mobile). The document is stamped with a verification badge carrying the encrypted ID and a QR code, and the final file's SHA-256 fingerprint is registered in a central verification registry.",
      "For multi-party signing, the creator emails a signature request to any external parties — even non-registered users — each signing via their own private secure link; the final document is stamped automatically when everyone has signed and the creator is notified. A public Verify page lets anyone confirm a signed document's authenticity: matching the ID and file fingerprint instantly exposes any tampering.",
    ],
  },
  {
    image: IMG.assistant,
    titleAr: "المساعد الذكي «نيرو»",
    titleEn: "Niro — The AI Assistant",
    bodyAr: [
      "«نيرو» مساعد ذكاء اصطناعي مدمج في المنصة يفهم سياق الشركة بالكامل: يجيب عن أسئلة مثل «كم مهمة متأخرة في محطة ألفا؟» أو «من الغائبون اليوم؟» اعتمادًا على بيانات الشركة الحقيقية، ويجيب بلغة المستخدم نفسها.",
      "لا يكتفي نيرو بالإجابة — بل ينفّذ إجراءات فعلية: إنشاء مهام، وصياغة تقارير، وتوليد مستندات وملفات كاملة بأي فكرة يطلبها المستخدم وبالتنظيم الذي يريده، مع إمكانية توقيع المستندات المولّدة رقميًا.",
      "يدعم نيرو التفاعل الصوتي: تحدث إليه بصوتك ويرد عليك صوتيًا، ويحتفظ بسجل محادثاتك الخاص بك. كما يشغّل خلف الكواليس ميزات ذكية في أنحاء المنصة: الملخص اليومي، والتنبيهات الاستباقية، واقتراحات التعبئة التلقائية للنماذج بناءً على عاداتك السابقة.",
    ],
    bodyEn: [
      "Niro is an AI assistant embedded in the platform that understands the company's full context: it answers questions like 'How many overdue tasks at Station Alpha?' or 'Who is absent today?' using the company's real data, replying in the user's own language.",
      "Niro doesn't just answer — it performs real actions: creating tasks, drafting reports, and generating complete documents and files for any idea the user requests, organized exactly as they want, with optional digital signing of generated documents.",
      "Niro supports voice interaction — speak to it and it replies aloud — and keeps your private conversation history. Behind the scenes it also powers smart features across the platform: the daily summary, proactive alerts, and smart form defaults based on your past habits.",
    ],
  },
  {
    image: IMG.personal,
    titleAr: "المساحة الشخصية: مخطط اليوم واليوميات والتقويم",
    titleEn: "Personal Workspace: Planner, Journal & Calendar",
    bodyAr: [
      "إلى جانب نمط الشركات، توفر المنصة حساب «فرد» بمساحة عمل شخصية كاملة. «مخطط اليوم» شبكة زمنية لتنظيم اليوم ساعة بساعة: مهام بأوقات محددة، وتذكيرات، وقوالب جاهزة لأيام متكررة، وروابط سريعة، ويستطيع نيرو اقتراح خطة يوم كاملة تلقائيًا.",
      "«يوميات الحياة» دفتر شخصي لتدوين الخواطر والإنجازات اليومية مع تتبع سلسلة الأيام المتتالية (Streak) الذي يحفّز على الاستمرارية، وبطاقة ملخص أسبوعي قابلة للمشاركة. و«التقويم الشهري» يعرض الشهر كاملًا بمهامه ومناسباته مع تصدير بصيغة ICS لمزامنته مع أي تطبيق تقويم خارجي.",
      "يشمل النمط الفردي أيضًا حضورًا شخصيًا بمواقع يحددها المستخدم بنفسه (مكتبه، ناديه الرياضي...)، وتحليلات التزام شخصية، وأزرار تصدير لكل بياناته. وكل هذه الأدوات متاحة أيضًا لموظفي الشركات في مساحتهم الخاصة.",
    ],
    bodyEn: [
      "Alongside company mode, the platform offers an Individual account with a full personal workspace. The Day Planner is an hour-by-hour time grid: timed tasks, reminders, reusable templates for recurring days and quick links — and Niro can propose a complete day plan automatically.",
      "The Life Journal is a personal notebook for daily thoughts and achievements with a consecutive-day streak tracker that motivates consistency, plus a shareable weekly summary card. The Monthly Calendar shows the whole month's tasks and events with ICS export for syncing to any external calendar app.",
      "Individual mode also includes personal attendance at self-defined locations (office, gym…), personal commitment analytics, and export buttons for all data. These tools are equally available to company employees in their own private space.",
    ],
  },
  {
    image: IMG.signing,
    titleAr: "الأمان وتعدد اللغات والاشتراكات",
    titleEn: "Security, Languages & Subscriptions",
    bodyAr: [
      "الأمان أساس المنصة: عزل كامل لبيانات كل شركة (Multi-Tenancy) بحيث يستحيل اطلاع شركة على بيانات أخرى، وتحقق ثنائي إلزامي برمز OTP يُرسل بالبريد عند كل تسجيل دخول (حتى للمالك)، وكلمات مرور مخزنة بتجزئة PBKDF2 لا تُحفظ نصًا أبدًا، وجلسات مشفرة بصلاحيات تُشتق من الخادم حصرًا، وسجل تدقيق كامل يوثق كل إجراء حساس: من فعل ماذا ومتى.",
      "تدعم المنصة 9 لغات كاملة مع تبديل فوري واتجاه كتابة تلقائي من اليمين لليسار للعربية في كل صفحة ومكوّن، ودخول عبر حساب Google إلى جانب البريد وكلمة المرور.",
      "نظام الاشتراكات يقدم خططًا متدرجة للشركات (مجانية، وستارتر، واحترافية، ومؤسسات) بفوترة شهرية أو سنوية (السنوية بخصم شهرين)، وخطة فردية مجانية، مع بوابة دفع Stripe وفترة تجريبية، ولوحة خاصة لمالك المنصة يتابع منها المشتركين والإحصاءات والإيرادات.",
    ],
    bodyEn: [
      "Security is foundational: complete multi-tenant isolation makes it impossible for one company to see another's data; mandatory two-step OTP email verification on every login (even for owners); passwords stored only as PBKDF2 hashes, never in plain text; encrypted sessions with server-derived permissions; and a full audit log documenting every sensitive action — who did what and when.",
      "The platform fully supports 9 languages with instant switching and automatic right-to-left layout for Arabic across every page and component, plus Google sign-in alongside email and password.",
      "The subscription system offers tiered company plans (Free, Starter, Professional, Enterprise) billed monthly or yearly (yearly gets two months free) and a free Individual plan, with Stripe checkout, a trial period, and a platform-owner panel for tracking subscribers, statistics and revenue.",
    ],
  },
];