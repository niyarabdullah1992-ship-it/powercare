import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListTodo, ClipboardCheck, Warehouse, ReceiptText, FileText, Megaphone, ShieldQuestion, UserCog } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { allowedNavFor } from "@/lib/navVisibility";
import { mobilePathsFor } from "@/lib/quickNavigation";

const TABS = [
  { to: "/app", icon: LayoutDashboard, key: "dashboard", end: true },
  { to: "/app/tasks", icon: ListTodo, key: "myTasks" },
  { to: "/app/attendance", icon: ClipboardCheck, key: "attendanceScheduling" },
  { to: "/app/inventory", icon: Warehouse, key: "inventory" },
  { to: "/app/expenses", icon: ReceiptText, key: "expenses" },
  { to: "/app/hr", icon: UserCog, key: "hr" },
  { to: "/app/daily-report", icon: FileText, key: "reports" },
  { to: "/app/complaints", icon: Megaphone, key: "allComplaints" },
  { to: "/app/safety", icon: ShieldQuestion, key: "safety" },
];

const memKey = (to) => `powercare_tab_last_${to}`;
const matchesTab = (tab, pathname) =>
  tab.end ? pathname === tab.to : pathname === tab.to || pathname.startsWith(tab.to + "/");

// Native-style fixed bottom tab bar (mobile only). Each tab remembers the last
// sub-route visited in its module — switching back restores that screen.
// Re-tapping the already-active tab pops the stack back to the module root.
export default function BottomTabBar() {
  const { t } = useI18n();
  const { currentUser, data } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const touchStart = useRef(null);

  // Persist the last sub-route accessed inside each tab's module.
  useEffect(() => {
    const tab = TABS.find((tb) => matchesTab(tb, location.pathname));
    if (tab && location.pathname !== tab.to) {
      sessionStorage.setItem(memKey(tab.to), location.pathname);
    }
  }, [location.pathname]);

  if (!currentUser) return null;
  const allowed = allowedNavFor(currentUser, data);
  const rolePaths = mobilePathsFor(currentUser.role);
  const tabs = rolePaths.map((path) => TABS.find((tab) => tab.to === path)).filter((tab) => tab && allowed.has(tab.to));
  if (tabs.length === 0) return null;

  const openTab = (tab) => {
    if (matchesTab(tab, location.pathname)) {
      // Active tab re-tap: reset the module back to its root. Uses replace so
      // the hardware back button and the custom back arrow see the same
      // history stack (no phantom entry for the screen that was just reset).
      sessionStorage.removeItem(memKey(tab.to));
      window.dispatchEvent(new CustomEvent("powercare:tab-reset", { detail: tab.to }));
      if (location.pathname !== tab.to) navigate(tab.to, { replace: true });
    } else {
      navigate(sessionStorage.getItem(memKey(tab.to)) || tab.to);
    }
  };

  const swipeTabs = (event) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) < 55) return;
    const activeIndex = tabs.findIndex((tab) => matchesTab(tab, location.pathname));
    const nextIndex = Math.max(0, Math.min(tabs.length - 1, activeIndex + (delta < 0 ? 1 : -1)));
    if (nextIndex !== activeIndex) openTab(tabs[nextIndex]);
  };

  return (
    <nav onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={swipeTabs} className="tech-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl no-select md:hidden">
      <div className="flex px-1 pt-1">
        {tabs.map((tab) => {
          const active = matchesTab(tab, location.pathname);
          return (
            <button
              key={tab.to}
              onClick={() => openTab(tab)}
              className={`relative flex min-h-[52px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] font-body transition-colors ${
                active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className={`truncate max-w-[72px] ${active ? "font-semibold" : ""}`}>{t(tab.key) || tab.key}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}