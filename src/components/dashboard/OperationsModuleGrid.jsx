import React from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Bot,
  CalendarCheck2,
  CalendarClock,
  CalendarOff,
  Camera,
  FileBarChart,
  FolderOpen,
  ListTodo,
  MessageCircle,
  MessagesSquare,
  Network,
  Package,
  PenTool,
  ReceiptText,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { canAccessPath } from "@/lib/navVisibility";
import PageSection from "@/components/claude/PageSection";

/**
 * Internal modules grouped by Platform IA (day rhythm), not org chart.
 */
export default function OperationsModuleGrid({ metrics, lang, user, data, company }) {
  const ar = lang === "ar";

  const groups = [
    {
      key: "daily",
      eyebrow: ar ? "يومي" : "Daily",
      title: ar ? "إيقاع يوم التشغيل" : "The operating day's rhythm",
      description: ar
        ? "مركز القيادة · المهام · الحضور · التقرير اليومي · المحادثات."
        : "Command center · operations · attendance · daily report · chat.",
      items: [
        { icon: ListTodo, title: ar ? "المهام والعمليات" : "Operations", note: ar ? `${metrics.completedTasks} مكتملة` : `${metrics.completedTasks} completed`, value: metrics.tasks, to: "/app/tasks" },
        { icon: CalendarCheck2, title: ar ? "الحضور" : "Attendance", note: ar ? `${metrics.checkedIn} حاضر اليوم` : `${metrics.checkedIn} present today`, value: `${metrics.attendanceRate}%`, to: "/app/attendance" },
        { icon: FileBarChart, title: ar ? "التقرير اليومي" : "Daily report", note: ar ? `${metrics.pendingReports} بانتظار المراجعة` : `${metrics.pendingReports} awaiting review`, value: metrics.reports, to: "/app/daily-report" },
        { icon: MessagesSquare, title: ar ? "المحادثات" : "Ops chat", note: ar ? "قنوات المحطات" : "station channels", value: metrics.messages, to: "/app/chat" },
      ],
    },
    {
      key: "workforce",
      eyebrow: ar ? "القوى العاملة" : "Workforce",
      title: ar ? "من يعمل وكيف يُدار" : "Who works and how they are managed",
      description: ar
        ? "ورديات · إجازات · موارد بشرية · توظيف · أداء · هيكل."
        : "Shifts · leave · HR · recruitment · performance · org.",
      items: [
        { icon: CalendarClock, title: ar ? "الورديات" : "Shifts", note: ar ? "جدول شهري" : "monthly matrix", value: metrics.stations, to: "/app/shifts" },
        { icon: CalendarOff, title: ar ? "الإجازات" : "Leave", note: ar ? "طلبات بانتظار المراجعة" : "awaiting review", value: metrics.pendingLeave, to: "/app/leave" },
        { icon: Users, title: ar ? "الموارد البشرية" : "HR", note: ar ? `${metrics.activeMembers} نشط اليوم` : `${metrics.activeMembers} active today`, value: metrics.employees, to: "/app/hr" },
        { icon: Briefcase, title: ar ? "التوظيف" : "Recruitment", note: ar ? "من الطلب إلى أول يوم" : "requisition to day one", value: "→", to: "/app/hiring" },
        { icon: TrendingUp, title: ar ? "الأداء" : "Performance", note: ar ? "من بيانات فعلية" : "from actual data", value: `${metrics.performance}%`, to: "/app/performance" },
        { icon: Network, title: ar ? "الهيكل" : "Org", note: ar ? "صلاحيات وتصعيد" : "permissions & escalation", value: metrics.stations, to: "/app/org" },
      ],
    },
    {
      key: "resources",
      eyebrow: ar ? "الموارد والامتثال" : "Resources & compliance",
      title: ar ? "مخزون، سلامة، إثبات، رواتب" : "Stock, safety, proof, payroll",
      description: ar
        ? "طبقة الموارد ودورة الإثبات — كما في تسليم التصميم."
        : "Resources and the proof cycle — per design handoff.",
      items: [
        { icon: Package, title: ar ? "المخزون" : "Inventory", note: ar ? "مواد ووحدات" : "stock & units", value: metrics.inventory, to: "/app/inventory" },
        { icon: ShieldCheck, title: ar ? "السلامة HSE" : "Safety HSE", note: ar ? `${metrics.hazards} مخاطر مفتوحة` : `${metrics.hazards} open hazards`, value: metrics.safety, to: "/app/safety" },
        { icon: Camera, title: ar ? "إثبات العمل" : "Work Proof", note: ar ? "قبل/بعد مختوم" : "stamped before/after", value: "→", to: "/app/work-proof" },
        { icon: PenTool, title: ar ? "التوقيع الرقمي" : "Digital signing", note: ar ? "Secure Sign" : "Secure Sign", value: metrics.signing, to: "/app/signing" },
        { icon: MessageCircle, title: ar ? "الشكاوى" : "Complaints", note: ar ? "مفتوحة الآن" : "open now", value: metrics.complaints, to: "/app/complaints" },
        { icon: FolderOpen, title: ar ? "الملفات" : "Files", note: ar ? "مقيّدة بالصلاحية" : "permission-scoped", value: metrics.files, to: "/app/files" },
        { icon: Banknote, title: ar ? "الرواتب" : "Payroll", note: ar ? "يغذيه الحضور" : "fed by attendance", value: metrics.payroll, to: "/app/payroll" },
      ],
    },
    {
      key: "admin",
      eyebrow: ar ? "الإدارة" : "Administration",
      title: ar ? "تقارير، مساعد، مصروفات، إعدادات" : "Reports, assistant, expenses, settings",
      description: ar
        ? "ما يُدار أسبوعيًا وشهريًا — مطوي في الشريط الجانبي."
        : "Weekly and monthly work — folded in the sidebar.",
      items: [
        { icon: BarChart3, title: ar ? "التقارير" : "Reports", note: ar ? "مكتبة وجدولة" : "library & schedule", value: "→", to: "/app/reports" },
        { icon: Bot, title: ar ? "المساعد" : "Assistant", note: ar ? "اسأل بيانات منشأتك" : "ask company data", value: ar ? "جاهز" : "Ready", to: "/app/assistant" },
        { icon: ReceiptText, title: ar ? "المصروفات" : "Expenses", note: ar ? "مقابل الميزانية" : "against budget", value: metrics.expenses, to: "/app/expenses" },
        { icon: Settings2, title: ar ? "الإعدادات" : "Settings", note: ar ? "نطاق وصلاحيات" : "scope & permissions", value: "→", to: "/app/settings" },
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
