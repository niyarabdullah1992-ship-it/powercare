# NiroVera — تسليم التنفيذ (خادم أولًا)

مرجع التصميم: `.tmp-design-caps/design_handoff_nirovera/`  
اقرأ `README.md` هناك كاملًا. المنطق والمعادلات في `class Component` داخل  
`NiroVera Platform.dc.html` — **ليس** في الـ markup وحده.  
`support.js` ليس جزءًا من التصميم — لا تُنقله.

---

## الطلب الحالي (نفّذه الآن)

```
اربط شاشة المهام والعمليات بـ base44.functions.invoke('operations', …) —
أزل كل رقم ثابت من الواجهة، واجعل كل عدّاد يُقرأ من الخادم.
لا تنتقل لقسم آخر قبل أن يعمل هذا القسم من الطرف إلى الطرف.
```

مسار التحقق الإلزامي قبل أي قسم لاحق:

1. أنشئ مهمة  
2. أسندها لموظف شهادته منتهية → يجب أن تُمنع بسبب مسمّى (`ASSIGN_GATE`)  
3. أسندها لمؤهَّل، سجّل الإنجاز، اعتمدها  
4. تحقق أن النقاط ظهرت في `PointsLedger` / الأداء  

إن نجح هذا المسار فالنمط صحيح، وبقية الأقسام تكرار له.

تنفيذ مرجعي موجود: `base44/shared/opsDerivations.ts` · `base44/functions/operations/entry.ts` · `src/pages/Operations.jsx` (`/app/tasks`).

---

## القاعدة الحاسمة — اقرأها قبل أي سطر كود

**ابدأ بالخادم لا بالشاشات.**

الشاشات موجودة أمامك في ملفات `.dc.html`. الناقص هو ما تحتها:

1. مخطط بيانات بعزل مستأجر صارم (`companyId` / tenant)
2. واجهة برمجية للمصادقة والجلسة
3. اشتقاق الأرقام على الخادم (العدّادات، النقاط، البوابات)
4. ثم قسم واحد كامل طرفًا إلى طرف — **المهام والعمليات** — قبل أي قسم آخر

لا تنسخ HTML. أعد البناء بأدوات المشروع: entities + functions في `base44/`،  
ثم React في `src/` وفق الأنماط القائمة. اتبع `AGENTS.md` و `CLAUDE.md`.

طلب واحد في كل مرحلة. لا تقفز إلى واجهة قبل أن يثبت الـ API والاختبار اليدوي للبوابات.

---

## ترتيب التنفيذ الإلزامي

| مرحلة | ماذا | متى تنتقل |
| --- | --- | --- |
| **A** | مخطط البيانات + مصادقة + عزل شركات | كل قراءة/كتابة مصفاة بـ `companyId` على الخادم |
| **B** | المهام والعمليات E2E (إنشاء → إثبات → اعتماد → نقاط → عدّادات) | نفس المعادلات أدناه؛ الواجهة تستهلك الـ API فقط |
| **C+** | أقسام أخرى واحدًا واحدًا | بعد اكتمال B فقط |

أي عمل يبدأ بـ Landing / shell / CSS قبل A مرفوض في هذه الجولة.

---

## المرحلة A — الأساس

### A1. عزل المستأجر (غير قابل للتفاوض)

- كل سجل تشغيلي يحمل `companyId` (في النموذج: `tenant` slug).
- الفلترة على الخادم فقط — `authPowerCareSession` + `companyDirectory` / service role.
- سجل بلا `companyId` **لا يُعرض** (لا fallback متساهل).
- Careers عامة ≠ هوية موظف. طابور طلبات التوظيف يكتب من الخارج ويُقرأ داخليًا باتجاه واحد فقط.

موجود جزئيًا: `CompanyAccount`, `CompanySession`, `Employee`, `Station`,  
`base44/shared/powerCareSession.ts`, `base44/functions/companyDirectory/entry.ts`.  
أكمل الفجوات؛ لا تبنِ مسار مصادقة موازيًا.

### A2. مخطط البيانات (حد أدنى للمهام)

ثبّت/وسّع الكيانات أو الجداول بحيث تغطي:

| كيان / مصدر | حقول لازمة للمهام |
| --- | --- |
| Task / target | `companyId`, `ref`, `title`, `stationId`, `priority`, `effortWeight`, `dueAt`, `planHorizon`, `planPinned`, `workKind`, `mode` (onsite/remote), `assignMode` (one/some/all), assignee ids, `targetCount`, `completedCount`, `status`, steps[], attachments |
| CompletionLog | إثبات (ملفات أو إفادة نصية)، كمّية، وقت، من سجّل |
| Approval | اعتماد/رفض بسبب مكتوب، مانح النقاط، وقت |
| PointsLedger | موجود — إدخالات append-only؛ النقاط تُمنح عند الاعتماد فقط |
| EmployeeCredential | شهادات الكفاءة وتاريخ الانتهاء (بوابة الإسناد) |
| AuditLog | كل إجراء: من + ماذا + متى |

الأرقام المعروضة (عدّادات الفلاتر، شارة الشريط الجانبي، نسبة الأفق الزمني)  
**مشتقة من قائمة المهام بعد النطاق** — لا تُخزَّن كنسخ حرفية منفصلة.

### A3. واجهة المصادقة

أكمل عبر `companyDirectory` + الجلسة الحالية:

- تسجيل دخول مالك / موظف مع OTP كما هو
- `sessionToken` مربوط بـ `companyId`
- كل استدعاء مهام يرفض بدون جلسة صالحة ونطاق شركة
- لا بيانات موظف عبر قناة Careers

---

## المرحلة B — المهام والعمليات (قسم واحد كامل)

مرجع المنطق: `class Component` في Platform حول Operations / Task detail  
(تقريبًا من محاور `PLANS`/`KINDS`/`horizonFor` وبطاقة المهمة و`points`).

### B1. معادلات يجب أن تعيش على الخادم

**نقاط المهمة (تُمنح عند اعتماد المشرف فقط، لا عند تسجيل الإنجاز):**

```
priorityValue = High→3 | Medium→2 | Low→1
points = priorityValue × effortWeight   // effortWeight ∈ [1..5]
```

**أفق الخطة (مشتق من تاريخ الاستحقاق ما لم يُثبَّت يدويًا):**

```
daysUntilDue = dueDate − today   // أجزاء تاريخ محلية، لا toISOString() لليوم
horizon = days ≤ 7 → w
        | ≤ 31 → m
        | ≤ 92 → q
        | ≤ 183 → h
        | else → y
```

**عدّادات العمليات (من الصفوف بعد فلتر النطاق):**

```
done     = progress === 100%
overdue  = due < today
today    = due === today
awaiting = completedCount ≥ targetCount && not yet approved
active   = totalInScope − done
badge    = overdue + awaiting
```

**بوابة الشهادة (تُسمّي السبب — لا تعطيل صامت):**

```
CERT_FOR: pm→loto, cm→loto, em→fa, pr→wah, cp→null
```

تُنفَّذ في الخادم عبر `checkAssignGate` داخل `operations` — بوابة المتصفح وحدها ليست بوابة.

### B2. API

`base44.functions.invoke('operations', { action, companyId, sessionToken, … })`

- `list` / `counts` / `create` / `logCompletion` / `approve` / `reject` / `checkGate` / `setCompetency`

### B3. الواجهة

`src/pages/Operations.jsx` على `/app/tasks` — العدّادات من `counts` فقط.
