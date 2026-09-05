# المهام والعمليات — التصميم والكود

صفحة التشغيل الحالية: `src/pages/Operations.jsx`

---

## 1) التصميم البصري

### توكنز الهوية (`src/lib/platformStyles.js`)

| رمز | قيمة | استخدام |
| --- | --- | --- |
| `NAVY` / `INK` | `#14284B` | عناوين، هيكل |
| `MUTED` | `#5A6B85` | ميتا ثانوية |
| `BRAND` | `#1E9E63` | زر أساسي / حالة نجاح |
| `SURFACE` | `#F7F8FA` | خلفية صف/شريط |
| `CARD` | `#FFFFFF` | بطاقات |
| `BORDER` | `#E2E8F0` | حدود |
| `OK` / `WARN` / `BAD` | أخضر / كهرماني / أحمر | حالة فقط — ليست زخرفة |

قواعد الكروم:
- صفحة `/app` → `PlatformStampShell` (سكة navy 3px، عرض 1280)
- أخضر `#1E9E63` = زر أساسي أو حالة — ليس جلد بطاقة

### تركيب الشاشة

```
PlatformStampShell
├── OpsToolbarStrip          فلاتر + قائمة/آفاق + إنشاء
├── DailyPaceStrip           إيقاع اللوحة (مجموع اليوم)
├── بانر حضور                أخضر إن check-in / أصفر إن موقوف
├── OpsNewTaskModal          عند الإنشاء
├── OpsTasksTable | آفاق     القائمة
├── OpsTaskDetail            لوحة التفاصيل
├── OpsReassignModal
└── OpsTransferModal
```

### صف المهمة (مؤسسي هادئ)

1. نقطة أولوية + **عنوان**
2. ميتا نصية: `ref · نوع · حضوري/عن بُعد · ×وزن` (+ تصعيد إن وُجد)
3. شريحة نقل/توكيل عند الحاجة فقط (`OpsAssignmentRefChip`)
4. محطة · مالك · استحقاق
5. تقدّم: `منجز/هدف` · ٪ · شريط · حصة اليوم

### تفاصيل المهمة

- رأس: حالة + شريط تقدّم + `DailyPaceStrip`
- وسط: إثبات (ملف/أثر) · تسجيل كمية · عائق إيقاع
- أسفل ثابت: محادثة + تعليم عائق
- اعتماد/رفض للمدير عند `awaiting_approval`

---

## 2) خريطة الكود

### طبقات

| طبقة | ملف |
| --- | --- |
| صفحة | `src/pages/Operations.jsx` |
| جدول | `src/components/tasks/OpsTasksTable.jsx` |
| تفاصيل | `src/components/tasks/OpsTaskDetail.jsx` |
| إنشاء | `src/components/tasks/OpsNewTaskModal.jsx` |
| شريط أدوات | `src/components/tasks/OpsToolbarStrip.jsx` |
| إيقاع | `src/components/tasks/DailyPaceStrip.jsx` |
| توكيل | `src/components/tasks/OpsReassignModal.jsx` |
| نقل | `src/components/tasks/OpsTransferModal.jsx` |
| شريحة إسناد | `src/components/tasks/OpsAssignmentRefChip.jsx` |
| اشتقاق عميل | `src/lib/opsDerivations.js` |
| احتياط محلي | `src/lib/localOpsFallback.js` |
| API | `base44/functions/operations/entry.ts` |
| اشتقاق خادم | `base44/shared/opsDerivations.ts` |
| schemas | `base44/shared/proofCycleSchemas.ts` |

### استدعاء API

```js
base44.functions.invoke("operations", {
  action,          // list | create | logCompletion | approve | …
  companyId,
  sessionToken,
  lang,
  scope,           // محطة أو null = الكل
  …payload
})
```

### إجراءات الخادم

| مجموعة | actions |
| --- | --- |
| قراءة | `list` `counts` `get` `ledger` `attendanceStatus` `checkGate` |
| إنشاء | `create` |
| إنجاز | `logCompletion` `addComment` `addAttachment` `setTaskMode` |
| مراجعة | `approve` `reject` |
| إسناد | `reassign` `endDelegation` |
| إيقاع | `extendDue` `redistributePace` |
| تصعيد | `runEscalationSweep` |

### نموذج المهمة (حقول تشغيلية)

| حقل | دور |
| --- | --- |
| `targetCount` / `completedCount` | الحصة والإنجاز |
| `dueAt` / `createdAt` | نافذة التوزيع المتساوي |
| `paceDayLog` / `paceBlocker` | سجل اليوم + عائق |
| `mode` | `onsite` \| `remote` — بوابة حضور |
| `effortWeight` + `priority` | نقاط بعد الاعتماد |
| `comments` / `proofFiles` / `attestation` | أثر الإثبات |
| `escalationLevel` | درجة التصعيد |
| `planHorizon` / `planPinned` | أفق w/m/q/h/y |

مشتق (لا يُخزَّن كحقيقة): `todayExpected` عبر `deriveDailyTaskPace`.

---

## 3) Proof Cycle في هذا القسم

1. **Attendance** — `attendanceStatus` قبل `logCompletion` للمهام الحضورية  
2. **Task** — تسجيل + أثر + إيقاع يومي  
3. **Review** — `approve` / `reject` + سبب  
4. **Escalation** — `runEscalationSweep` عند حرق الحصة  
5–6. **Sign / Client proof** — خارج القسم (`FileSigning` / `ClientProof`)

---

## 4) قواعد عند التعديل

1. أي رقم ظاهر ← من `opsDerivations` (لا صيغة مكررة في JSX)  
2. عدّل `base44/shared/opsDerivations.ts` ثم زامن `src/lib/opsDerivations.js`  
3. إجراء جديد = `entry.ts` + schema في `proofCycleSchemas`  
4. نفس المسار في `localOpsFallback` للمعاينة/تعطل السحابة  
5. القائمة = ميتا هادئة؛ التفاصيل = إثبات وتعليق وعائق  
6. لا تقطع: حضور → تسجيل → اعتماد → تصعيد  
