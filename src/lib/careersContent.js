/** Static copy + illustrative roles for the public Careers marketing surface.
 *  Live vacancies come from hiring.publicList when ?company= is present.
 */

export const CAREERS_STEPS = [
  {
    n: "1",
    ar: { label: "استلام الطلب", when: "خلال يوم عمل" },
    en: { label: "Application received", when: "Within one working day" },
  },
  {
    n: "2",
    ar: { label: "الفرز والاختبار", when: "مهلة 7 أيام من يوم فتح الشاغر" },
    en: { label: "Screening & technical test", when: "7-day SLA from vacancy open day" },
  },
  {
    n: "3",
    ar: { label: "المقابلة", when: "مهلة 7 أيام" },
    en: { label: "Interview", when: "7-day SLA" },
  },
  {
    n: "4",
    ar: { label: "العرض أو الرد", when: "لن تُترك بلا إجابة — بالرقم المرجعي" },
    en: { label: "Offer or decision", when: "You will not be left without an answer — use your reference" },
  },
];

export const CAREERS_SAMPLE_ROLES = [
  {
    key: "demo-ops",
    titleAr: "مهندس تشغيل — فرع ميدانية",
    titleEn: "Operations Engineer — field station",
    stationAr: "فرع تشغيل",
    stationEn: "Operating station",
    grade: "G9",
    expAr: "5+ سنوات",
    expEn: "5+ years",
    contractAr: "دوام كامل",
    contractEn: "Full time",
  },
  {
    key: "demo-elec",
    titleAr: "فني كهرباء",
    titleEn: "Electrical Technician",
    stationAr: "فرع تشغيل",
    stationEn: "Operating station",
    grade: "G6",
    expAr: "3+ سنوات",
    expEn: "3+ years",
    contractAr: "دوام كامل",
    contractEn: "Full time",
  },
  {
    key: "demo-hse",
    titleAr: "مشرف سلامة",
    titleEn: "Safety Supervisor",
    stationAr: "فرع تشغيل",
    stationEn: "Operating station",
    grade: "G8",
    expAr: "6+ سنوات",
    expEn: "6+ years",
    contractAr: "دوام كامل",
    contractEn: "Full time",
  },
];

export const CAREERS_ROLE_SECTIONS = [
  {
    titleAr: "ماذا ستعمل",
    titleEn: "What you will do",
    itemsAr: [
      "تشغيل ومتابعة معدات الفرع وفق إجراءات التشغيل المعتمدة.",
      "إغلاق أوامر العمل بإثبات مصوّر مختوم بالموقع والوقت.",
      "التبليغ عن المخاطر فور ملاحظتها — التبليغ مكافأ لا مؤاخذ عليه.",
      "المشاركة في الورديات المنشورة مسبقًا بجدول معلوم قبل بدايتها.",
    ],
    itemsEn: [
      "Operate and monitor station equipment under approved operating procedures.",
      "Close work orders with photo proof stamped with location and time.",
      "Report hazards the moment you see them — reporting is rewarded, never penalised.",
      "Work published shift rotas, known in advance of the week they cover.",
    ],
  },
  {
    titleAr: "ما نبحث عنه",
    titleEn: "What we look for",
    itemsAr: [
      "كفاءة مثبتة في المجال — لا نوظّف على الوساطة.",
      "التزام بإجراءات السلامة وسلسلة الإثبات.",
      "قدرة على العمل ضمن وردية معلنة مسبقًا.",
    ],
    itemsEn: [
      "Proven competence in the field — we hire on merit alone.",
      "Commitment to safety procedures and the proof chain.",
      "Ability to work a published shift rota.",
    ],
  },
];

export function careersPublicPath(companyId, jobKey) {
  const q = new URLSearchParams();
  if (companyId) q.set("company", companyId);
  if (jobKey) q.set("job", jobKey);
  const s = q.toString();
  return s ? `/careers?${s}` : "/careers";
}
