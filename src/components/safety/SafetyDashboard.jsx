import React, { useMemo, useState } from "react";
import { Activity, AlertTriangle, BadgeCheck, CheckCircle2, ChevronDown, Clock3, ShieldAlert, Siren, TriangleAlert } from "lucide-react";
import { buildSafetyDashboardData } from "@/lib/safetyDashboardData";
import SafetyDashboardCharts from "@/components/safety/SafetyDashboardCharts";
import SafetyMetricCard from "@/components/safety/SafetyMetricCard";

export default function SafetyDashboard({ safety, stations, lang }) {
  const [open, setOpen] = useState(true);
  const ar = lang === "ar";
  const dashboard = useMemo(() => buildSafetyDashboardData(safety, stations, lang), [safety, stations, lang]);
  const kpiTone = (value, target) => value <= target ? "text-emerald-600" : value <= target * 1.5 ? "text-amber-600" : "text-red-600";
  const kpiCards = [
    { icon: Activity, label: ar ? "TRIR الموحّد" : "Company TRIR", value: dashboard.companyKpis.trir.toFixed(2), sub: ar ? "الهدف ≤ 3" : "Target ≤ 3", help: ar ? "معدل إجمالي الإصابات القابلة للتسجيل لكل 200,000 ساعة عمل. يُحسب بقسمة عدد الإصابات المسجلة على ساعات العمل ثم الضرب في 200,000؛ وكلما انخفض كان الأداء أفضل." : "Total Recordable Incident Rate per 200,000 work hours. It equals recordable incidents divided by work hours, multiplied by 200,000; lower values indicate better performance.", tone: kpiTone(dashboard.companyKpis.trir, 3), alert: dashboard.companyKpis.trir > 4.5 },
    { icon: ShieldAlert, label: ar ? "LTIFR الموحّد" : "Company LTIFR", value: dashboard.companyKpis.ltifr.toFixed(2), sub: ar ? "الهدف ≤ 1" : "Target ≤ 1", help: ar ? "معدل إصابات الوقت الضائع لكل مليون ساعة عمل. يقيس الإصابات التي أدت إلى غياب الموظف عن العمل، وانخفاضه يدل على تحكم أفضل بالمخاطر الجسيمة." : "Lost Time Injury Frequency Rate per one million work hours. It measures injuries that caused absence from work; a lower rate indicates stronger control of serious risks.", tone: kpiTone(dashboard.companyKpis.ltifr, 1), alert: dashboard.companyKpis.ltifr > 1.5 },
    { icon: Clock3, label: ar ? "ساعات العمل" : "Work Hours", value: dashboard.companyKpis.totalHours.toLocaleString(), sub: ar ? "الإجمالي المسجل" : "total recorded", help: ar ? "مجموع ساعات العمل الشهرية المسجلة لجميع المحطات. تُستخدم هذه الساعات كأساس حساب مؤشري TRIR وLTIFR، لذلك يجب تحديثها بدقة كل شهر." : "The total monthly work hours recorded across all stations. These hours are the denominator for TRIR and LTIFR, so they should be updated accurately each month.", tone: dashboard.companyKpis.totalHours > 0 ? "text-emerald-600" : "text-red-600" },
    { icon: TriangleAlert, label: ar ? "إجمالي LTI" : "Total LTI", value: dashboard.companyKpis.totalLti, sub: ar ? "إصابات الوقت الضائع" : "lost-time injuries", help: ar ? "إجمالي الإصابات التي منعت الموظف من أداء عمله في يوم عمل تالٍ للحادث. الصفر هو الوضع المستهدف، وأي قيمة أعلى تتطلب مراجعة وتحقيقًا." : "The total injuries that prevented an employee from working on a subsequent workday. Zero is the target; any higher value requires review and investigation.", tone: dashboard.companyKpis.totalLti === 0 ? "text-emerald-600" : dashboard.companyKpis.totalLti === 1 ? "text-amber-600" : "text-red-600", alert: dashboard.companyKpis.totalLti > 1 },
    { icon: CheckCircle2, label: ar ? "امتثال التحقق" : "Compliance", value: `${dashboard.companyKpis.compliance}%`, sub: ar ? "قوائم التحقق" : "safety checklists", help: ar ? "نسبة بنود قوائم السلامة التي تم تأكيد استيفائها في جميع المحطات. تُحسب من الإجابات الإيجابية مقارنة بإجمالي البنود المقيّمة، وكلما اقتربت من 100% كان الامتثال أفضل." : "The percentage of safety checklist items confirmed as compliant across all stations. It compares positive responses with all assessed items; values closer to 100% indicate stronger compliance.", tone: dashboard.companyKpis.compliance >= 70 ? "text-emerald-600" : dashboard.companyKpis.compliance >= 50 ? "text-amber-600" : "text-red-600", alert: dashboard.companyKpis.compliance < 50 },
  ];
  const statusCards = [
    { icon: Siren, label: ar ? "حوادث هذا الشهر" : "Monthly Incidents", value: dashboard.stats.currentMonth, sub: ar ? "خلال الشهر الحالي" : "this month", help: ar ? "عدد حوادث السلامة المسجلة بتاريخ يقع ضمن الشهر الحالي في جميع المحطات. يستخدم لمتابعة التغير الشهري واكتشاف الارتفاع غير المعتاد في الحوادث." : "The number of safety incidents dated within the current month across all stations. Use it to monitor monthly change and detect unusual increases.", alert: dashboard.stats.currentMonth > 0 },
    { icon: ShieldAlert, label: ar ? "محطات حرجة" : "Critical Stations", value: dashboard.stats.critical, sub: ar ? "تتطلب تدخلاً" : "require attention", help: ar ? "عدد المحطات المصنفة حاليًا بالمستوى الأحمر. هذا التصنيف يعني وجود حالة سلامة حرجة تستلزم تدخلاً إداريًا وإجراءات تصحيحية عاجلة." : "The number of stations currently rated red. A red rating indicates a critical safety condition requiring management attention and urgent corrective action.", alert: dashboard.stats.critical > 0 },
    { icon: AlertTriangle, label: ar ? "مخاطر مفتوحة" : "Open Hazards", value: dashboard.stats.openHazards, sub: ar ? "عبر جميع المحطات" : "across all stations", help: ar ? "إجمالي المخاطر المسجلة التي لم يتم إغلاقها بعد في جميع المحطات. يظل الخطر مفتوحًا حتى توثيق الإجراء التصحيحي وإغلاقه من سجل المحطة." : "The total recorded hazards not yet closed across all stations. A hazard remains open until its corrective action is documented and it is closed in the station record.", alert: dashboard.stats.openHazards > 0 },
    { icon: BadgeCheck, label: ar ? "محطات معتمدة" : "Approved Stations", value: dashboard.stats.approved, sub: ar ? "بيانات سلامة معتمدة" : "approved safety data", help: ar ? "عدد المحطات التي اعتمد المسؤول المخول أحدث بيانات السلامة الخاصة بها. تعديل بيانات المحطة بعد الاعتماد يلغي الاعتماد السابق حتى تتم مراجعتها مجددًا." : "The number of stations whose latest safety data has been approved by an authorized reviewer. Editing station data after approval clears the previous approval until it is reviewed again." },
  ];

  return (
    <section className="space-y-4">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 text-start">
        <span>
          <span className="block font-heading text-xl font-semibold">{ar ? "لوحة مؤشرات السلامة" : "Safety Overview"}</span>
          <span className="mt-1 block text-sm font-body text-muted-foreground">{ar ? "نظرة شاملة على مؤشرات السلامة والمخاطر في جميع المحطات" : "A company-wide view of safety performance, incidents and hazards"}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpiCards.map((card) => <SafetyMetricCard key={card.label} {...card} />)}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statusCards.map((card) => <SafetyMetricCard key={card.label} {...card} />)}
        </div>
        <SafetyDashboardCharts months={dashboard.months} hazards={dashboard.hazards} lang={lang} />
      </div>}
    </section>
  );
}