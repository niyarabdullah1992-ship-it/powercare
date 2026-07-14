import React from "react";
import { useI18n } from "@/lib/i18n";
import { HelpCircle, LayoutDashboard, ListTodo, CalendarDays, ClipboardCheck, PenLine, FolderOpen, Sparkles } from "lucide-react";
import HelpSection from "@/components/help/HelpSection";

export default function IndividualHelp() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const sections = [
    {
      icon: LayoutDashboard,
      title: ar ? "لوحة التحكم" : "Your Dashboard",
      steps: ar
        ? ["بعد تسجيل الدخول تصل إلى مساحتك الشخصية مع ملخص مهامك.", "استخدم القائمة الجانبية (أو الشريط السفلي في الجوال) للتنقل بين الأقسام."]
        : ["After logging in you land on your personal workspace with a summary of your tasks.", "Use the sidebar (or the bottom bar on mobile) to move between sections."],
    },
    {
      icon: ListTodo,
      title: ar ? "مهامي" : "My Tasks",
      steps: ar
        ? ["أنشئ مهامك بنفسك وحدد لكل مهمة هدفًا وعددًا ومدة.", "نظّم مهامك في أقسام (مجلدات) بحرية — واسحبها بينها كما تريد.", "سجّل ما أنجزته بزر تسجيل الإنجاز وتابع تقدمك."]
        : ["Create your own tasks and give each one a target, amount and duration.", "Organize tasks freely into sections (folders) — drag them around as you like.", "Log what you complete with the log button and watch your progress."],
    },
    {
      icon: CalendarDays,
      title: ar ? "جدولي اليومي" : "Day Planner",
      steps: ar
        ? ["افتح «جدولي اليومي» ورتّب يومك عنصرًا بعنصر مع وقت لكل عنصر.", "علّم ما أنجزته وتابع نسبة إنجاز يومك.", "تنقّل بين الأيام لتخطط للغد أو تراجع الأمس."]
        : ["Open Day Planner and build your day item by item, each with its time.", "Tick off what you finish and watch your day's progress bar.", "Move between days to plan tomorrow or review yesterday."],
    },
    {
      icon: ClipboardCheck,
      title: ar ? "حضوري" : "My Attendance",
      steps: ar
        ? ["أضف المقرات التي تقضي وقتك فيها (المنزل، المكتب، المقهى...).", "سجّل حضورك عند الوصول وخروجك عند المغادرة.", "تابع تحليل وقتك: ساعات اليوم والأسبوع ومتوسط وقت دخولك."]
        : ["Add the places where you spend your time (home, office, café...).", "Check in when you arrive and check out when you leave.", "See your time analysis: daily and weekly hours and your average check-in time."],
    },
    {
      icon: PenLine,
      title: ar ? "التوقيع الرقمي" : "Digital Signing",
      steps: ar
        ? ["ارفع مستند PDF ووقّعه بتوقيعك المرسوم أو المكتوب.", "يُختم المستند بشارة تحقق مشفّرة برقم فريد يمكن التحقق منه لاحقًا."]
        : ["Upload a PDF and sign it with your drawn or typed signature.", "The document is stamped with an encrypted verification badge and a unique ID anyone can verify later."],
    },
    {
      icon: FolderOpen,
      title: ar ? "ملفاتي" : "My Files",
      steps: ar
        ? ["احفظ مستنداتك الخاصة في مجلدات — ويمكنك إنشاء مجلدات داخل مجلدات.", "ملفاتك خاصة بك ومحفوظة في السحابة تلقائيًا."]
        : ["Store your personal documents in folders — folders can nest inside folders.", "Your files are private and saved to the cloud automatically."],
    },
    {
      icon: Sparkles,
      title: ar ? "المساعد الذكي Niro" : "Niro AI Assistant",
      steps: ar
        ? ["اسأل نيرو عن مهامك أو اطلب منه تلخيص يومك.", "يمكنه مساعدتك في تنظيم وقتك وإنجاز أعمالك."]
        : ["Ask Niro about your tasks or have it summarize your day.", "It can help you organize your time and get things done."],
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
            ? "دليل سريع لمساحتك الشخصية: المهام، الجدول اليومي، الحضور، التوقيع والملفات."
            : "A quick guide to your personal workspace: tasks, day planner, attendance, signing and files."}
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