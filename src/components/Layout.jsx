import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, getCompanyData, getCompanyToken } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, ListTodo, ShieldQuestion, Search,
  Bell, LogOut, Globe, ChevronDown, ChevronLeft, ChevronRight, Trophy, UserCog, Megaphone, MessageSquare, FileText, PenLine, ClipboardCheck, X, FolderOpen, Sparkles, HelpCircle, Banknote, Warehouse, ReceiptText, ShieldCheck,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Logo from "@/components/Logo";
import SwipeToDeleteItem from "@/components/notifications/SwipeToDeleteItem";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import { allowedNavFor } from "@/lib/navVisibility";
import BottomTabBar from "@/components/mobile/BottomTabBar";
import BackButton from "@/components/mobile/BackButton";
import ProductFeedbackPrompt from "@/components/ProductFeedbackPrompt";
import { shouldShowNotification } from "@/lib/notificationFilters";
import { routeForNotification } from "@/lib/notificationRoute";
import SectionGuide from "@/components/SectionGuide";
import GlobalSearch from "@/components/navigation/GlobalSearch";

export default function Layout({ children }) {
  const { t, lang, setLang, dir, languages } = useI18n();
  const { currentUser, company, data, logout, isSyncing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [proactiveAlerts, setProactiveAlerts] = useState([]);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const notificationPollInFlightRef = useRef(false);
  const [navOrder, setNavOrder] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("powercare_sidebar_collapsed") === "true");

  useEffect(() => {
    localStorage.setItem("powercare_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!company) return;
    const saved = localStorage.getItem(`powercare_corporate_nav_v1_${company.id}`);
    if (saved) {
      try { setNavOrder(JSON.parse(saved)); } catch { setNavOrder([]); }
    }
  }, [company?.id]);

  useEffect(() => {
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const openSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  useEffect(() => {
    setProactiveAlerts([]);
    const receive = (event) => {
      const key = `powercare_proactive_read_${company?.id}_${currentUser?.id}`;
      const readIds = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
      setProactiveAlerts((event.detail || []).map((alert) => ({ ...alert, read: readIds.has(alert.id) })));
    };
    window.addEventListener("powercare:proactive-alerts", receive);
    return () => window.removeEventListener("powercare:proactive-alerts", receive);
  }, [company?.id, currentUser?.id]);

  // Real-time notification polling (Supabase → local bell)
  useEffect(() => {
    if (!currentUser || !company) return;
    const poll = async () => {
      if (notificationPollInFlightRef.current || document.visibilityState !== "visible" || navigator.onLine === false) return;
      notificationPollInFlightRef.current = true;
      try {
        const dismissedKey = `powercare_notification_dismissed_${company.id}_${currentUser.id}`;
        const dismissedIds = new Set(JSON.parse(localStorage.getItem(dismissedKey) || "[]"));
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listNotifications",
          userId: currentUser.id,
          companyId: company.id,
          sessionToken: getCompanyToken(company.id),
        });
        const remote = (res.data?.notifications || []).filter((notification) =>
          !dismissedIds.has(String(notification.id)) && shouldShowNotification(notification.message, data)
        );
        const current = getCompanyData(company.id);
        if (!current) return;
        const existing = new Set(
          current.notifications.filter((n) => n.userId === currentUser.id).map((n) => n.text)
        );
        const fresh = remote.filter((rn) => !existing.has(rn.message));
        if (fresh.length === 0) return;
        updateCompany(company.id, (d) => {
          for (const rn of fresh) {
            d.notifications.unshift({
              id: "snf_" + (rn.id || Math.random().toString(36).slice(2)),
              userId: currentUser.id,
              text: rn.message,
              read: false,
              createdAt: rn.created_at || new Date().toISOString(),
            });
          }
        });
        // Fire instant in-site toast alerts for each new notification
        for (const rn of fresh) {
          toast({
            title: t("notifications"),
            description: rn.message,
          });
        }
      } catch {
        // Supabase not configured or unreachable — silent
      } finally {
        notificationPollInFlightRef.current = false;
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id, company?.id]);

  if (!currentUser || !data) return children;

  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: lang === "ar" ? "لوحة المعلومات" : "Dashboard", end: true, category: "core" },
    { to: "/app/hr", icon: UserCog, label: lang === "ar" ? "الموظفون" : "Employees", category: "core" },
    { to: "/app/attendance", icon: ClipboardCheck, label: lang === "ar" ? "الحضور والانصراف" : "Attendance", category: "core" },
    { to: "/app/payroll", icon: Banknote, label: lang === "ar" ? "مسير الرواتب" : "Payroll", category: "core" },
    { to: "/app/performance", icon: Trophy, label: lang === "ar" ? "إدارة الأداء" : "Performance", category: "core" },
    { to: "/app/tasks", icon: ListTodo, label: lang === "ar" ? "المهام" : "Tasks", category: "operations" },
    { to: "/app/daily-report", icon: FileText, label: lang === "ar" ? "التقرير اليومي" : "Daily report", category: "operations" },
    { to: "/app/inventory", icon: Warehouse, label: lang === "ar" ? "المخزون والعهد" : "Inventory", category: "operations" },
    { to: "/app/expenses", icon: ReceiptText, label: lang === "ar" ? "المصروفات" : "Expenses", category: "operations" },
    { to: "/app/safety", icon: ShieldQuestion, label: lang === "ar" ? "السلامة والامتثال" : "Safety & compliance", category: "operations" },
    { to: "/app/files", icon: FolderOpen, label: lang === "ar" ? "المستندات" : "Documents", category: "governance" },
    { to: "/app/signing", icon: PenLine, label: lang === "ar" ? "التوقيع الرقمي" : "Digital signing", category: "governance" },
    { to: "/app/client-proof", icon: ShieldCheck, label: lang === "ar" ? "إثبات العمل للعميل" : "Client work proof", category: "governance" },
    { to: "/app/complaints", icon: Megaphone, label: lang === "ar" ? "الشكاوى" : "Complaints", category: "governance" },
    { to: "/app/assistant", icon: Sparkles, label: lang === "ar" ? "المساعد الذكي" : "Assistant", category: "management" },
    { to: "/app/chat", icon: MessageSquare, label: lang === "ar" ? "الدردشة" : "Chat", category: "management" },
    { to: "/app/manual", icon: HelpCircle, label: lang === "ar" ? "التقارير" : "Guides", category: "management" },
  ];

  const navGroupLabels = {
    core: lang === "ar" ? "الأساسية" : "Core",
    operations: lang === "ar" ? "العمليات" : "Operations",
    governance: lang === "ar" ? "الحوكمة والوثائق" : "Governance",
    management: lang === "ar" ? "الإدارة" : "Admin",
  };
  const categoryOrder = ["core", "operations", "governance", "management"];

  // Role-based visibility: each user only sees the sections their role needs.
  const allowedNav = allowedNavFor(currentUser, data, company);
  const visibleNavItems = navItems.filter((i) => allowedNav.has(i.to));

  const orderKeys = navOrder.length ? navOrder : visibleNavItems.map((i) => i.to);
  const orderedNavItems = [
    ...orderKeys.map((to) => visibleNavItems.find((i) => i.to === to)).filter(Boolean),
    ...visibleNavItems.filter((i) => !orderKeys.includes(i.to)),
  ].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

  const onNavDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedNavItems);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const newOrder = items.map((i) => i.to);
    setNavOrder(newOrder);
    if (company) localStorage.setItem(`powercare_corporate_nav_v1_${company.id}`, JSON.stringify(newOrder));
  };

  const myNotifs = [
    ...proactiveAlerts,
    ...data.notifications.filter(
      (notification) => notification.userId === currentUser.id && shouldShowNotification(notification.text, data)
    ),
  ];
  const unread = myNotifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    updateCompany(company.id, (d) => {
      d.notifications.forEach((n) => {
        if (n.userId === currentUser.id) n.read = true;
      });
    });
    const ids = proactiveAlerts.map((alert) => alert.id);
    localStorage.setItem(`powercare_proactive_read_${company.id}_${currentUser.id}`, JSON.stringify(ids));
    setProactiveAlerts((alerts) => alerts.map((alert) => ({ ...alert, read: true })));
  };

  const dismissNotification = (id) => {
    if (proactiveAlerts.some((alert) => alert.id === id)) {
      setProactiveAlerts((alerts) => alerts.filter((alert) => alert.id !== id));
      return;
    }
    if (String(id).startsWith("snf_")) {
      const remoteId = String(id).slice(4);
      const key = `powercare_notification_dismissed_${company.id}_${currentUser.id}`;
      const dismissedIds = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
      dismissedIds.add(remoteId);
      localStorage.setItem(key, JSON.stringify([...dismissedIds]));
      base44.functions.invoke("supabaseTargets", {
        action: "dismissNotification",
        notificationId: remoteId,
        userId: currentUser.id,
        companyId: company.id,
        sessionToken: getCompanyToken(company.id),
      }).catch(() => {});
    }
    updateCompany(company.id, (d) => {
      d.notifications = d.notifications.filter((n) => n.id !== id);
    });
  };

  // Clicking a notification marks it read and jumps to the page it refers to.
  const openNotification = (n) => {
    if (n.type === "proactive") {
      const key = `powercare_proactive_read_${company.id}_${currentUser.id}`;
      const ids = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
      ids.add(n.id); localStorage.setItem(key, JSON.stringify([...ids]));
      setProactiveAlerts((alerts) => alerts.map((alert) => alert.id === n.id ? { ...alert, read: true } : alert));
    } else {
      updateCompany(company.id, (d) => {
        const target = d.notifications.find((x) => x.id === n.id);
        if (target) target.read = true;
      });
    }
    setNotifOpen(false);
    navigate(n.to || routeForNotification(n.text));
  };

  const sidebarSide = dir === "rtl" ? "right-0" : "left-0";

  const pageTitles = {
    "/app": lang === "ar" ? "لوحة المعلومات" : "Dashboard",
    "/app/hr": lang === "ar" ? "الموارد البشرية" : "HR",
    "/app/attendance": lang === "ar" ? "الحضور والانصراف" : "Attendance",
    "/app/payroll": lang === "ar" ? "مسير الرواتب" : "Payroll",
    "/app/performance": lang === "ar" ? "إدارة الأداء" : "Performance",
    "/app/tasks": lang === "ar" ? "المهام" : "Tasks",
    "/app/daily-report": lang === "ar" ? "التقرير اليومي" : "Daily report",
    "/app/inventory": lang === "ar" ? "المخزون والعهد" : "Inventory",
    "/app/expenses": lang === "ar" ? "المصروفات" : "Expenses",
    "/app/safety": lang === "ar" ? "السلامة والامتثال" : "Safety",
    "/app/files": lang === "ar" ? "المستندات" : "Documents",
    "/app/signing": lang === "ar" ? "التوقيع الرقمي" : "Digital signing",
    "/app/client-proof": lang === "ar" ? "إثبات العمل للعميل" : "Client work proof",
    "/app/complaints": lang === "ar" ? "الشكاوى والبلاغات" : "Complaints",
    "/app/assistant": lang === "ar" ? "المساعد الذكي" : "Assistant",
    "/app/chat": lang === "ar" ? "المحادثات" : "Chat",
    "/app/manual": lang === "ar" ? "دليل الاستخدام" : "User guide",
  };
  const pageTitle = (() => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    const hit = Object.keys(pageTitles).find((key) => key !== "/app" && path.startsWith(key));
    return hit ? pageTitles[hit] : (lang === "ar" ? "نيروفيرا" : "NiroVera");
  })();
  const periodLabel = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });
  const roleTitle = t(currentUser.role) || currentUser.role;
  const roleInitials = currentUser.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

  return (
    <div className="powercare-shell min-h-screen bg-background flex" dir={dir}>
      {/* Desktop navigation — Claude handoff shell */}
      <aside className={`corporate-sidebar hidden md:flex flex-col ${sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-[250px] opacity-100"} ${sidebarSide} top-0 h-screen sticky overflow-hidden bg-[#0B1A3F] pt-safe z-40 transition-[width,opacity] duration-200`}>
        <div className={`flex flex-col gap-1.5 ${sidebarCollapsed ? "px-2 pb-4 pt-5" : "px-5 pb-5 pt-5"}`}>
          <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white p-[3px]">
              <Logo size={31} />
            </span>
            {!sidebarCollapsed && (
              <span className="font-heading text-[17px] font-semibold leading-none text-white">NiroVera</span>
            )}
          </div>
          {!sidebarCollapsed && (
            <p className="text-[11.5px] text-[#8C9AB8]">{lang === "ar" ? "منظومة الموارد البشرية" : "HR operating system"}</p>
          )}
        </div>

        <DragDropContext onDragEnd={onNavDragEnd}>
          <Droppable droppableId="sidebar-nav">
            {(provided) => (
              <nav ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 w-full flex flex-col gap-3.5 overflow-y-auto no-scrollbar no-select ${sidebarCollapsed ? "px-2" : "px-3"}`}>
                {orderedNavItems.map((item, index) => (
                  <Draggable key={item.to} draggableId={item.to} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`group relative w-full ${dragSnapshot.isDragging ? "opacity-90" : ""}`}
                      >
                        {!sidebarCollapsed && (index === 0 || orderedNavItems[index - 1]?.category !== item.category) && (
                          <div className="px-3 pb-1.5 pt-1">
                            <p className="text-[10.5px] tracking-[0.1em] text-[#5C6E96]">{navGroupLabels[item.category]}</p>
                          </div>
                        )}
                        <NavLink
                          to={item.to}
                          end={item.end}
                          title={item.label}
                          className={({ isActive }) =>
                            `flex w-full items-center rounded-lg px-3 py-2 text-[13px] transition-colors ${sidebarCollapsed ? "justify-center" : "gap-2.5"} ${
                              isActive
                                ? "bg-[#16274F] text-white"
                                : "text-[#B9C3D8] hover:bg-[#16274F] hover:text-white"
                            }`
                          }
                        >
                          <span className="handoff-nav-dot" aria-hidden />
                          {!sidebarCollapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
                          {sidebarCollapsed && <item.icon className="h-4 w-4" strokeWidth={1.7} />}
                        </NavLink>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </nav>
            )}
          </Droppable>
        </DragDropContext>

        {!sidebarCollapsed && (
          <div className="mt-auto flex flex-col gap-2.5 border-t border-[#1B2C55] px-3 pb-4 pt-4">
            <div className="px-2 text-[11.5px] leading-relaxed text-[#8C9AB8]">
              {lang === "ar" ? "الفترة الحالية" : "Current period"}
              <br />
              <span className="text-[13px] text-white">{periodLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/app/employees/${currentUser.id}`)}
              className="flex items-center gap-2.5 rounded-lg bg-[#0F2148] p-2 text-start transition hover:bg-[#16274F]"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E7A4B] text-xs text-white">
                {currentUser.profile?.avatarUrl ? (
                  <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  roleInitials
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] text-white">{currentUser.name}</span>
                <span className="block truncate text-[11px] text-[#8C9AB8]">{roleTitle}</span>
              </span>
            </button>
          </div>
        )}
      </aside>
      <button
        type="button"
        onClick={() => setSidebarCollapsed((value) => !value)}
        title={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
        className={`fixed top-[70px] z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-[#1B2C55] bg-[#0B1A3F] text-[#B9C3D8] shadow-md transition-[left,right] duration-200 hover:bg-[#16274F] hover:text-white md:flex ${dir === "rtl" ? (sidebarCollapsed ? "right-3" : "right-[238px]") : (sidebarCollapsed ? "left-3" : "left-[238px]")}`}
        aria-label={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
      >
        {sidebarCollapsed ? (dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : (dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)}
      </button>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — handoff: title + search + compliance + tools */}
        <header className="powercare-global-header sticky top-0 z-40 overflow-visible border-b border-[#E4E7EC] bg-white pt-safe text-foreground">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:gap-4 md:px-[26px] md:py-[13px]">
            <div className="md:hidden flex min-w-0 items-center gap-2">
              <BackButton />
              <h1 className="truncate text-[15px] font-semibold text-[#101828]">{pageTitle}</h1>
            </div>

            <h1 className="hidden m-0 text-[17px] font-semibold text-[#101828] md:block">{pageTitle}</h1>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden min-w-[180px] max-w-[360px] flex-1 items-center gap-2 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-2 text-start text-[13px] text-[#98A2B3] md:flex"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">{lang === "ar" ? "بحث عن موظف، طلب، أو مستند…" : "Search employee, request, or document…"}</span>
              <span className="ms-auto text-[11px] text-[#98A2B3]">⌘K</span>
            </button>

            <div className="ms-auto flex items-center gap-2 md:gap-3">
              <span className="hidden rounded-md bg-[#E8F3ED] px-2.5 py-1.5 text-xs font-semibold text-[#0E7A4B] sm:inline">
                {lang === "ar" ? "التزام النظام" : "Compliance"}
              </span>
              <span className="hidden rounded-md border border-[#E4E7EC] px-2.5 py-1.5 text-xs text-[#475467] md:inline">{periodLabel}</span>

              <button onClick={() => setSearchOpen(true)} aria-label={lang === "ar" ? "البحث العام" : "Global search"} className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-[#475467] hover:bg-[#F2F4F7] md:hidden"><Search className="h-5 w-5" /></button>
              <SyncStatusIndicator isSyncing={isSyncing} />
              <ThemeToggle />
              {/* Language */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium text-[#475467] hover:bg-[#F2F4F7] font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("language")}
                >
                  <Globe className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{languages.find((l) => l.code === lang)?.flag}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {langOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-44 bg-card text-foreground border border-border rounded-md shadow-lg py-1 z-50`}>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false); }}
                        className={`w-full text-start px-3 py-2 text-sm font-body flex items-center gap-2 hover:bg-muted ${
                          lang === l.code ? "text-accent font-medium" : "text-foreground"
                        }`}
                      >
                        <span>{l.flag}</span> {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2 rounded-md text-[#475467] hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("notifications")}
                >
                  <Bell className="w-5 h-5" strokeWidth={1.75} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-body flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-80 max-w-[90vw] bg-card text-foreground border border-border rounded-md shadow-xl z-50`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="font-heading font-semibold text-sm">{t("notifications")}</p>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                          {t("markRead")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {myNotifs.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted-foreground text-center">{t("noNotifications")}</p>
                      ) : (
                        myNotifs.slice(0, 12).map((n) => (
                          <SwipeToDeleteItem key={n.id} onDelete={() => dismissNotification(n.id)}>
                            <div className={`flex items-start gap-2 px-4 py-3 border-b border-border/60 ${n.read ? "opacity-60" : ""}`}>
                              <button
                                onClick={() => openNotification(n)}
                                className="flex-1 min-w-0 text-start hover:opacity-80 transition-opacity"
                              >
                                <p className="text-sm font-body">{n.text}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(n.createdAt).toLocaleString(lang)}
                                </p>
                              </button>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                aria-label="dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </SwipeToDeleteItem>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User switcher */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen((o) => !o)}
                  className="flex items-center justify-center gap-2 rounded-md text-foreground hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full bg-[#0B1A3F] text-[12.5px] font-medium text-white">
                    {currentUser.profile?.avatarUrl ? (
                      <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      roleInitials
                    )}
                  </div>
                  <ChevronDown className="w-3 h-3 hidden sm:block text-[#98A2B3]" />
                </button>
                {userOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-64 bg-card text-foreground border border-border rounded-md shadow-xl z-50`}>
                    <button
                      onClick={() => { navigate(`/app/employees/${currentUser.id}`); setUserOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted text-start"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0B1A3F] text-white flex items-center justify-center text-sm font-medium overflow-hidden shrink-0">
                        {currentUser.profile?.avatarUrl ? (
                          <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          roleInitials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{currentUser.name}</p>
                        <p className="text-xs text-accent">{t("viewProfile")}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => window.dispatchEvent(new Event("powercare:open-feedback"))}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted font-body"
                    >
                      <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
                      {lang === "ar" ? "التقييم والاقتراحات" : "Feedback & suggestions"}
                    </button>
                    <button
                      onClick={() => { logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2 px-4 py-3 border-t border-border text-sm text-destructive hover:bg-muted font-body"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.75} />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-[22px] pb-28 md:px-[26px] md:pb-8 md:pt-[22px]">
          {/* Native-style page transition between routes */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="powercare-interior-page mx-auto w-full max-w-[1600px]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <SectionGuide lang={lang} t={t} />
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} items={visibleNavItems} data={data} currentUser={currentUser} lang={lang} />
      {/* Native-style bottom tab bar (mobile only) */}
      <BottomTabBar />
      <ProductFeedbackPrompt companyId={company.id} role={currentUser.role} />
    </div>
  );
}