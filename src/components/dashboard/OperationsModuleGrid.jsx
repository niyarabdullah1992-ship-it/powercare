import React from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Bot,
  CalendarCheck2,
  CalendarOff,
  CircleHelp,
  FileBarChart,
  FolderOpen,
  ListTodo,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Package,
  PenTool,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserMinus,
  Users,
  BadgeCheck,
} from "lucide-react";
import { canAccessPath } from "@/lib/navVisibility";
import PageSection from "@/components/claude/PageSection";

/**
 * Internal modules grouped like Claude calm sections,
 * content derived from NiroVera Proof Cycle layers.
 */
export default function OperationsModuleGrid({ metrics, lang, user, data, company }) {
  const ar = lang === "ar";

  const groups = [
    {
      key: "people",
      eyebrow: ar ? "الأشخاص" : "People",
      title: ar ? "من يعمل وأين يحضر" : "Who works and where they show up",
      description: ar
        ? "الملف الوظيفي والحضور والإجازات — أساس دورة الإثبات."
        : "Profiles, attendance and leave — the base of the proof cycle.",
      items: [
        { icon: MapPin, title: ar ? "المحطات" : "Stations", note: ar ? "محطة تحت المتابعة" : "stations monitored", value: metrics.stations, to: "/app/hr" },
        { icon: Users, title: ar ? "دليل الموظفين" : "Employees", note: ar ? `${metrics.activeMembers} نشط اليوم` : `${metrics.activeMembers} active today`, value: metrics.employees, to: "/app/hr" },
        { icon: CalendarCheck2, title: ar ? "الحضور والجداول" : "Attendance", note: ar ? `${metrics.checkedIn} حاضر اليوم` : `${metrics.checkedIn} present today`, value: `${metrics.attendanceRate}%`, to: "/app/attendance" },
        { icon: CalendarOff, title: ar ? "الإجازات" : "Leave", note: ar ? "طلبات بانتظار المراجعة" : "awaiting review", value: metrics.pendingLeave, to: "/app/attendance" },
        { icon: UserMinus, title: ar ? "إنهاء الخدمة" : "Offboarding", note: ar ? "ملفات قيد الإجراء" : "cases in progress", value: metrics.offboarding, to: "/app/hr" },
        { icon: Banknote, title: ar ? "الرواتب" : "Payroll", note: ar ? "يغذيه الحضور والطلبات" : "fed by attendance & requests", value: metrics.payroll, to: "/app/payroll" },
      ],
    },
    {
      key: "ops",
      eyebrow: ar ? "العمليات" : "Operations",
      title: ar ? "تنفيذ يُثبت ويُراجع" : "Work that is proven and reviewed",
      description: ar
        ? "المهام بوزن جهد، التقارير اليومية، والعهد والمصروفات — حلقة الإنجاز."
        : "Effort-weighted tasks, daily reports, inventory and expenses — the delivery loop.",
      items: [
        { icon: ListTodo, title: ar ? "المهام" : "Tasks", note: ar ? `${metrics.completedTasks} مكتملة` : `${metrics.completedTasks} completed`, value: metrics.tasks, to: "/app/tasks" },
        { icon: FileBarChart, title: ar ? "التقارير اليومية" : "Daily reports", note: ar ? `${metrics.pendingReports} بانتظار المراجعة` : `${metrics.pendingReports} awaiting review`, value: metrics.reports, to: "/app/daily-report" },
        { icon: TrendingUp, title: ar ? "الأداء" : "Performance", note: ar ? "معدل إنجاز المهام" : "completion rate", value: `${metrics.performance}%`, to: "/app/performance" },
        { icon: Package, title: ar ? "المخزون والعهد" : "Inventory", note: ar ? "مواد ووحدات" : "stock & units", value: metrics.inventory, to: "/app/inventory" },
        { icon: ReceiptText, title: ar ? "المصروفات" : "Expenses", note: ar ? "مطالبات قيد المسار" : "claims in flow", value: metrics.expenses, to: "/app/expenses" },
        { icon: ShieldCheck, title: ar ? "السلامة" : "Safety", note: ar ? `${metrics.hazards} مخاطر مفتوحة` : `${metrics.hazards} open hazards`, value: metrics.safety, to: "/app/safety" },
      ],
    },
    {
      key: "trust",
      eyebrow: ar ? "الثقة" : "Trust",
      title: ar ? "توقيع، إثبات، وصوت آمن" : "Signing, proof, and safe voice",
      description: ar
        ? "من المستند الموقّع إلى إثبات العميل والبلاغات — طبقة لا تنقطع عن الاعتماد."
        : "From signed docs to client proof and reports — the approval trust layer.",
      items: [
        { icon: FolderOpen, title: ar ? "المستندات" : "Documents", note: ar ? "ملفات محفوظة" : "stored files", value: metrics.files, to: "/app/files" },
        { icon: PenTool, title: ar ? "التوقيع الرقمي" : "Digital signing", note: ar ? "Secure Sign" : "Secure Sign", value: metrics.signing, to: "/app/signing" },
        { icon: BadgeCheck, title: ar ? "إثبات العمل للعميل" : "Client proof", note: ar ? "ختم قابل للتحقق" : "verifiable seal", value: "→", to: "/app/client-proof" },
        { icon: MessageCircle, title: ar ? "الشكاوى والبلاغات" : "Complaints", note: ar ? "مفتوحة الآن" : "open now", value: metrics.complaints, to: "/app/complaints" },
        { icon: MessagesSquare, title: ar ? "الرسائل" : "Messages", note: ar ? "تواصل داخلي" : "internal chat", value: metrics.messages, to: "/app/chat" },
        { icon: Bot, title: ar ? "المساعد نيرو" : "Niro assistant", note: ar ? "اسأل بيانات منشأتك" : "ask your company data", value: ar ? "جاهز" : "Ready", to: "/app/assistant" },
        { icon: CircleHelp, title: ar ? "المساعدة" : "Help", note: ar ? "دليل الأقسام" : "section guides", value: "24/7", to: "/app/help" },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPath(item.to, user, data, company)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <PageSection
          key={group.key}
          eyebrow={group.eyebrow}
          title={group.title}
          description={group.description}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${group.key}-${item.to}-${item.title}`}
                  to={item.to}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-accent/40 hover:bg-secondary/40"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </span>
                    <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                      {item.value}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                </Link>
              );
            })}
          </div>
        </PageSection>
      ))}
    </div>
  );
}
