import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { HelpCircle, LayoutDashboard, ListTodo, FileText, ClipboardCheck, MessageSquare, AlertTriangle } from "lucide-react";
import HelpSection from "@/components/help/HelpSection";
import IndividualHelp from "@/components/individual/IndividualHelp";

export default function Help() {
  const { lang } = useI18n();
  const { data, company } = useAuth();
  const ar = lang === "ar";

  // Individuals get their own guide — the company guide talks about stations,
  // managers and escalation, which don't exist in a personal workspace.
  if (String(data?.plan || company?.plan || "").toLowerCase() === "individual") {
    return <IndividualHelp />;
  }

  const sections = [
    {
      icon: LayoutDashboard,
      title: ar ? "البداية: لوحة التحكم" : "Getting started: the Dashboard",
      steps: ar
        ? [
            "بعد تسجيل الدخول تصل مباشرة إلى لوحة التحكم، وفيها ملخص مهامك وإشعاراتك.",
            "استخدم القائمة الجانبية (أو الشريط السفلي في الجوال) للتنقل بين الأقسام.",
            "اسحب الشاشة للأسفل في الجوال لتحديث البيانات في أي وقت.",
          ]
        : [
            "After logging in you land on the Dashboard, which summarizes your tasks and notifications.",
            "Use the sidebar (or the bottom bar on mobile) to move between sections.",
            "On mobile, pull the screen down to refresh your data at any time.",
          ],
    },
    {
      icon: ClipboardCheck,
      title: ar ? "تسجيل الحضور أولاً" : "Check in first",
      steps: ar
        ? [
            "ابدأ يومك بتسجيل الحضور من صفحة «الحضور» — بعض إجراءات المهام لا تعمل قبل تسجيل الحضور.",
            "تأكد من تفعيل الموقع الجغرافي إذا كانت محطتك تتطلب التحقق من الموقع.",
            "لا تنسَ تسجيل الانصراف في نهاية الدوام.",
          ]
        : [
            "Start your day by checking in from the Attendance page — some task actions are locked until you check in.",
            "Enable location access if your station requires location verification.",
            "Don't forget to check out at the end of your shift.",
          ],
    },
    {
      icon: ListTodo,
      title: ar ? "التعامل مع المهام" : "Working with tasks",
      steps: ar
        ? [
            "افتح صفحة «مهامي» ثم اختر محطتك لتصفح المهام داخل الأقسام (المجلدات).",
            "لكل مهمة هدف عددي — سجّل ما أنجزته بالضغط على زر تسجيل الإنجاز وأدخل العدد.",
            "قد يُطلب منك إرفاق إثبات (صورة أو ملف) عند إكمال المهمة — يراجعه مديرك ثم تُحتسب نقاطك.",
            "استخدم التعليقات داخل المهمة للاستفسار، وفعّل خيار «مشكلة» إذا كان هناك عائق يوقف العمل.",
          ]
        : [
            "Open My Tasks, then pick your station to browse tasks inside sections (folders).",
            "Each task has a numeric target — log what you completed using the log button and enter the amount.",
            "You may need to attach proof (photo or file) when completing a task — your manager reviews it, then your points are awarded.",
            "Use comments inside a task to ask questions, and mark 'issue' if something is blocking the work.",
          ],
    },
    {
      icon: FileText,
      title: ar ? "التقارير اليومية" : "Daily reports",
      steps: ar
        ? [
            "من صفحة «التقرير اليومي» أرسل ملخص عملك في نهاية كل يوم.",
            "اذكر ما أنجزته وأي ملاحظات أو مشاكل واجهتها.",
            "صفحة «التقارير» تعرض لك سجل المهام والإجازات خلال أي فترة تختارها.",
          ]
        : [
            "From the Daily Report page, submit a summary of your work at the end of each day.",
            "Mention what you accomplished and any notes or problems you faced.",
            "The Reports page shows your task and leave history for any period you choose.",
          ],
    },
    {
      icon: MessageSquare,
      title: ar ? "التواصل والطلبات" : "Communication & requests",
      steps: ar
        ? [
            "استخدم «محادثة المحطة» للتواصل مع فريقك مباشرة.",
            "طلبات الإجازة والشهادات تُرسل من ملفك الشخصي وتصل لمديرك للاعتماد.",
            "صفحة «الشكاوى» تتيح لك رفع شكوى — ويمكن إرسالها بهوية مجهولة إذا رغبت.",
          ]
        : [
            "Use Station Chat to communicate with your team directly.",
            "Leave requests and certificates are submitted from your profile and go to your manager for approval.",
            "The Complaints page lets you raise a complaint — anonymously if you prefer.",
          ],
    },
    {
      icon: AlertTriangle,
      title: ar ? "إذا رُفض إنجازك" : "If your completion is rejected",
      steps: ar
        ? [
            "يجب على المدير كتابة سبب الرفض — ستجده في تعليقات المهمة.",
            "إذا لم تقتنع بالسبب يمكنك تقديم اعتراض، ويُصعَّد تلقائيًا للمستوى الإداري الأعلى.",
          ]
        : [
            "Managers must write a reason for any rejection — you'll find it in the task comments.",
            "If you disagree, you can submit an objection, which is automatically escalated to the next management level.",
          ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          <HelpCircle className="w-6 h-6" /> {ar ? "دليل الاستخدام" : "User Guide"}
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {ar
            ? "دليل سريع للموظفين الجدد: كيف تستخدم النظام وتتعامل مع المهام والتقارير اليومية."
            : "A quick guide for new employees: how to use the system and handle tasks and daily reports."}
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((s) => (
          <HelpSection key={s.title} icon={s.icon} title={s.title} steps={s.steps} />
        ))}
      </div>
    </div>
  );
}