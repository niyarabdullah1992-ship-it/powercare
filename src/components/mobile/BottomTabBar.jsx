import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const memKey = (to) => `powercare_tab_last_${to}`;
const matchesTab = (tab, pathname) =>
  tab.end ? pathname === tab.to : pathname === tab.to || pathname.startsWith(tab.to + "/");

// Native-style fixed bottom tab bar (mobile only). Each tab remembers the last
// sub-route visited in its module — switching back restores that screen.
// Re-tapping the already-active tab pops the stack back to the module root.
export default function BottomTabBar() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Persist the last sub-route accessed inside each tab's module.
  useEffect(() => {
    const tab = TABS.find((tb) => matchesTab(tb, location.pathname));
    if (tab && location.pathname !== tab.to) {
      sessionStorage.setItem(memKey(tab.to), location.pathname);
    }
  }, [location.pathname]);

  if (!currentUser) return null;
  const allowed = allowedNavFor(currentUser);
  const tabs = TABS.filter((tab) => allowed.has(tab.to));
  if (tabs.length === 0) return null;

  const openTab = (tab) => {
    if (matchesTab(tab, location.pathname)) {
      // Active tab re-tap: reset the module back to its root.
      sessionStorage.removeItem(memKey(tab.to));
      window.dispatchEvent(new CustomEvent("powercare:tab-reset", { detail: tab.to }));
      if (location.pathname !== tab.to) navigate(tab.to);
    } else {
      navigate(sessionStorage.getItem(memKey(tab.to)) || tab.to);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border pb-safe no-select">
      <div className="flex">
        {tabs.map((tab) => {
          const active = matchesTab(tab, location.pathname);
          return (
            <button
              key={tab.to}
              onClick={() => openTab(tab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-body transition-colors ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="truncate max-w-[72px]">{t(tab.key) || tab.key}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}