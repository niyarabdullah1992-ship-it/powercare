import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { allowedNavFor } from "@/lib/navVisibility";
import {
  FileText, ListTodo, ClipboardCheck, MessageSquare, FolderOpen, Sparkles,
  Megaphone, Users, Radio, HardHat, Trophy, FileBarChart2, UserCog,
} from "lucide-react";

const ALL_ACTIONS = [
  { to: "/app/daily-report", icon: FileText, key: "reports" },
  { to: "/app/tasks", icon: ListTodo, key: "myTasks" },
  { to: "/app/attendance", icon: ClipboardCheck, key: "attendanceScheduling" },
  { to: "/app/chat", icon: MessageSquare, key: "chat" },
  { to: "/app/assistant", icon: Sparkles, key: "aiAssistant" },
  { to: "/app/complaints", icon: Megaphone, key: "allComplaints" },
  { to: "/app/employees", icon: Users, key: "employees" },
  { to: "/app/stations", icon: Radio, key: "stations" },
  { to: "/app/hr", icon: UserCog, key: "hr" },
  { to: "/app/safety", icon: HardHat, key: "safety" },
  { to: "/app/performance", icon: Trophy, key: "performance" },
  { to: "/app/reports", icon: FileBarChart2, key: "tasksReport" },
  { to: "/app/files", icon: FolderOpen, key: "files" },
];

// Role-aware quick-access grid: shows only the sections the user is allowed to open.
export default function QuickActions({ user }) {
  const { t } = useI18n();
  const allowed = allowedNavFor(user);
  const actions = ALL_ACTIONS.filter((a) => allowed.has(a.to));

  return (
    <div>
      <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-3">{t("quickAccess")}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <a.icon className="w-4 h-4" strokeWidth={1.5} />
            </span>
            <span className="text-[11px] font-body text-center leading-tight text-foreground/80 group-hover:text-foreground">{t(a.key)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}