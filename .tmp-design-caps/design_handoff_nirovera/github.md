repo: niyarabdullah1992-ship-it/powercare
branch: main

## Last sync
date: 2026-08-10T07:46:04Z

### Updated in this project
- محرر جدول الورديات مبنيًا على `StationScheduleEditor.jsx`: تنقّل شهري، مصفوفة نوع الوردية × أيام الشهر بإسناد موظفين لكل خلية، والجدول مقيّد بمحطة واحدة كما في `ScheduleTab.jsx`
- تحرير نوع الوردية (الاسم ووقتا البداية والنهاية والحذف) من `ShiftTypeEditor.jsx`
- شريط الملخص بأرقامه الأربعة المشتقة (الموظفون، الساعات المجدولة، نسبة التغطية، الخلايا بلا إسناد) من `ScheduleStatsBar.jsx`
- شرط الجدول وشرط الموقع الجغرافي مفتاحان للمالك، كما في `AttendanceEmergencyPanel.jsx`
- بطاقة المهمة الكاملة من `TaskCard.jsx`: الخطوات، المرفقات، المحادثة مع تعليم العائق، وتسجيل الإنجاز بالإثبات أو الإفادة
- إرفاق الملفات على المهمة وعلى التعليق وعلى الإثبات، بنمط `CommentFiles.jsx`
- قاعدة "لا نقطة بلا أثر": لا يُسجَّل إنجاز دون صورة أو إفادة، والنقاط تنتظر اعتماد المشرف
- التنبيهات الاستباقية بفئاتها الأربع من `useProactiveAlerts.js`، محسوبة من المخزون والحضور والمهام
- سلسلة التصعيد بمستوياتها من `escalation.js` (المستوى 0 = مدير المحطة ثم تدرّج الموارد البشرية)
- معرّف التحقق على كل توقيع من `clientDigitalStamp.js`
- حدود البلاغات المجهولة (3 / 10 / 30) من `settings` في `store.js`
- مصفوفة الصلاحيات مشتقة من `navVisibility.js` (BASE لكل الأدوار، MANAGER_EXTRA، EXEC_EXTRA، التفويض)
- ملف الموظف الكامل بخمسة تبويبات، مبني على `ProfessionalInfoTab.jsx` و`leaveTypes.js` و`SalaryTab.jsx` و`ContractForm.jsx`
- مجموعة "الالتزام النظامي" (هوية/إقامة، GOSI، قوى، رخصة عمل، جواز، تأمين طبي، فحص طبي) مع وسم ما ينتهي خلال 60 يومًا
- أرصدة الإجازات النظامية مصفّاة حسب الجنس كما في `isLeaveTypeAllowed`
- نموذج المهمة أصبح مطابقًا للتطبيق: وزن الجهد ×1..×5 بمسمياته، نمط الإنجاز (حضوري/عن بُعد)، والعدد المستهدف
- اقتراح وزن الجهد من مسمى المسؤول، منقول عن `suggestEffortWeight` في `effortWeights.js`
- هوية NiroVera الرسمية من `base44/shared/brand.ts` مطبقة على كل المخرجات
- بناء المنصة (16 قسمًا)، العرض البيعي، الصفحة التسويقية، وتطبيق الجوال

## Screen map
| الشاشة | ملفات المصدر |
| --- | --- |
| الهوية البصرية | base44/shared/brand.ts, src/lib/brand.js, src/components/Logo.jsx |
| المهام والعمليات | src/components/tasks/TaskCard.jsx, src/lib/effortWeights.js |
| ملف الموظف | src/components/employees/ProfessionalInfoTab.jsx, SalaryTab.jsx, ContractForm.jsx, CertificatesTab.jsx |
| الإجازات | src/lib/leaveTypes.js |
| التنبيهات الاستباقية | src/hooks/useProactiveAlerts.js |
| الشكاوى والتصعيد | src/lib/escalation.js |
| التوقيع الرقمي | src/lib/clientDigitalStamp.js |
| جدول الورديات | src/components/schedules/StationScheduleEditor.jsx, ScheduleCell.jsx, ScheduleStatsBar.jsx |
| الحضور والانصراف | src/components/attendance/AttendanceDailyDashboard.jsx, CheckInOutCard.jsx, AttendanceEmergencyPanel.jsx |
| بطاقة المهمة | src/components/tasks/TaskCard.jsx, CommentFiles.jsx, src/lib/effortWeights.js |
| مركز القيادة | src/pages/Dashboard.jsx |
| الصلاحيات والتنقل | src/App.jsx, src/lib/navVisibility.js |
| الباقات والأسعار | src/pages/Pricing.jsx, src/lib/subscriptionPlans.js |
| الصفحة التسويقية | src/pages/Landing.jsx |
| طبقة البيانات | src/lib/store.js |

## Sync history
- 2026-08-09T23:58:58Z — بطاقة المهمة الكاملة والمرفقات
- 2026-08-09T22:36:33Z — التنبيهات الاستباقية وسلسلة التصعيد
- 2026-08-09T20:46:00Z — ملف الموظف والالتزام النظامي
- 2026-08-09T20:19:18Z — وزن الجهد ونموذج المهمة
- 2026-08-09T19:12:00Z — اعتماد الهوية الرسمية وبناء الشاشات الأولى
- 2026-08-09T17:53:13Z — القراءة الأولى وتقييم المنصة
