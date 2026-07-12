import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ListTodo, MessageSquare, ClipboardCheck, FolderOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { allowedNavFor } from "@/lib/navVisibility";

const TABS = [
  { to: "/app", icon: LayoutDashboard, key: "dashboard", end: true },
  { to: "/app/tasks", icon: ListTodo, key: "myTasks" },
  { to: "/app/chat", icon: MessageSquare, key: "chat" },
  { to: "/app/attendance", icon: ClipboardCheck, key: "attendanceScheduling" },
  { to: "/app/files", icon: FolderOpen, key: "files" },
];

// Native-style fixed bottom tab bar (mobile only). Re-tapping the active tab
// broadcasts a reset event so pages can return their path state to root.
export default function BottomTabBar() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) return null;
  const allowed = allowedNavFor(currentUser);
  const tabs = TABS.filter((tab) => allowed.has(tab.to));
  if (tabs.length === 0) return null;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border pb-safe no-select">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            onClick={() => {
              if (location.pathname === tab.to) {
                window.dispatchEvent(new CustomEvent("powercare:tab-reset", { detail: tab.to }));
              }
            }}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-body transition-colors ${
                isActive ? "text-accent" : "text-muted-foreground"
              }`
            }
          >
            <tab.icon className="w-5 h-5" strokeWidth={1.75} />
            <span className="truncate max-w-[72px]">{t(tab.key) || tab.key}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}