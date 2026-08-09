import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { RefreshCw } from "lucide-react";
import { updateCompany, getCompanyData, getCompanyToken } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, ListTodo, ShieldQuestion, Radio, Search,
  Bell, LogOut, Globe, ChevronDown, ChevronLeft, ChevronRight, UserCircle, Trophy, UserCog, Megaphone, MessageSquare, FileText, PenLine, ClipboardCheck, X, FolderOpen, Sparkles, HelpCircle, Banknote, Warehouse, Boxes, ReceiptText, FileCheck2, Users, Inbox,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Logo from "@/components/Logo";
import PresenceDot from "@/components/employees/PresenceDot";
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
import CompanyNameEditor from "@/components/CompanyNameEditor";
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
    { to: "/app", icon: LayoutDashboard, label: t("dashboard"), end: true, category: "main" },
    { to: "/app/assistant", icon: Sparkles, label: lang === "ar" ? "المساعد نيرو" : t("aiAssistant"), category: "main" },
    { to: "/app/tasks", icon: ListTodo, label: t("myTasks"), category: "operations" },
    { to: "/app/daily-report", icon: FileText, label: t("reports"), category: "operations" },
    { to: "/app/assets", icon: Boxes, label: lang === "ar" ? "الأصول والعهد" : "Assets & custody", category: "operations" },
    { to: "/app/inventory", icon: Warehouse, label: t("inventory"), category: "operations" },
    { to: "/app/safety", icon: ShieldQuestion, label: lang === "ar" ? "السلامة (HSE)" : "Safety (HSE)", category: "operations" },
    { to: "/app/hr", icon: UserCog, label: t("hr"), category: "workforce" },
    { to: "/app/employees", icon: Users, label: lang === "ar" ? "الموظفون" : "Employees", category: "workforce" },
    { to: "/app/attendance", icon: ClipboardCheck, label: t("attendanceScheduling"), category: "workforce" },
    { to: "/app/leave-requests", icon: Inbox, label: lang === "ar" ? "الإجازات والطلبات" : "Leaves & Requests", category: "workforce" },
    { to: "/app/performance", icon: Trophy, label: t("performance"), category: "workforce" },
    { to: "/app/payroll", icon: Banknote, label: lang === "ar" ? "الرواتب" : "Payroll", category: "finance" },
    { to: "/app/expenses", icon: ReceiptText, label: t("expenses"), category: "finance" },
    { to: "/app/signing", icon: PenLine, label: t("fileSigning"), category: "governance" },
    { to: "/app/work-proof", icon: FileCheck2, label: lang === "ar" ? "إثبات العمل" : "Work Proof", category: "governance" },
    { to: "/app/files", icon: FolderOpen, label: t("files"), category: "governance" },
    { to: "/app/complaints", icon: Megaphone, label: t("allComplaints"), category: "governance" },
    { to: "/app/chat", icon: MessageSquare, label: t("chat"), category: "support" },
    { to: "/app/manual", icon: HelpCircle, label: t("userGuide"), category: "support" },
  ];

  const navGroupLabels = {
    main: lang === "ar" ? "الرئيسية" : "Main",
    operations: lang === "ar" ? "العمليات" : "Operations",
    workforce: lang === "ar" ? "القوى العاملة" : "Workforce",
    finance: lang === "ar" ? "المالية" : "Finance",
    governance: lang === "ar" ? "الحوكمة والوثائق" : "Governance & documents",
    support: lang === "ar" ? "أدوات مساندة" : "Tools",
  };
  const navGroupOrder = ["main", "operations", "workforce", "finance", "governance", "support"];

  // Role-based visibility: each user only sees the sections their role needs.
  const allowedNav = allowedNavFor(currentUser, data, company);
  const visibleNavItems = navItems.filter((i) => allowedNav.has(i.to));

  const orderKeys = navOrder.length ? navOrder : visibleNavItems.map((i) => i.to);
  // Custom drag order is respected inside each group, but groups always stay
  // contiguous so the sidebar keeps its five-section structure.
  const orderedNavItems = [
    ...orderKeys.map((to) => visibleNavItems.find((i) => i.to === to)).filter(Boolean),
    ...visibleNavItems.filter((i) => !orderKeys.includes(i.to)),
  ].sort((a, b) => navGroupOrder.indexOf(a.category) - navGroupOrder.indexOf(b.category));

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

  return (
    <div className="powercare-shell min-h-screen bg-background flex" dir={dir}>
      {/* Desktop navigation */}
      <aside className={`corporate-sidebar hidden md:flex flex-col ${sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-[268px] opacity-100"} ${sidebarSide} top-0 h-screen sticky overflow-hidden bg-primary pt-safe z-40 shadow-elevated transition-[width,opacity] duration-200`}>
        <div className={`relative flex items-center border-b border-white/10 py-4 ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-5"}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-landing-gold/30 bg-white/95 shadow-sm"><Logo size={31} /></span>
          {!sidebarCollapsed && <div className="min-w-0 pe-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-landing-gold-light">NiroVera</p>
            <p className="mt-0.5 truncate font-heading text-lg font-semibold text-white">{company.name || t("appName")}</p>
            <p className="truncate text-[9px] uppercase tracking-[0.12em] text-white/35">{lang === "ar" ? "منصة العمليات المؤسسية" : "Enterprise Operations"}</p>
          </div>}

        </div>
        <DragDropContext onDragEnd={onNavDragEnd}>
          <Droppable droppableId="sidebar-nav">
            {(provided) => (
              <nav ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 w-full py-3 flex flex-col gap-0.5 overflow-y-auto no-scrollbar no-select ${sidebarCollapsed ? "px-2" : "px-4"}`}>
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
                          <p className={`px-3 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-[#8C9AB8] ${index === 0 ? "pt-2" : "mt-3 border-t border-white/10 pt-3"}`}>
                            {navGroupLabels[item.category]}
                          </p>
                        )}
                        <NavLink
                          to={item.to}
                          end={item.end}
                          title={item.label}
                          className={({ isActive }) =>
                            `flex h-9 w-full items-center rounded-md transition-colors ${sidebarCollapsed ? "justify-center px-1" : "gap-3 px-3"} ${
                              isActive
                                ? "bg-white/10 text-white [&_svg]:text-landing-gold"
                                : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0 text-[#8C9AB8]" strokeWidth={1.7} />
                          {!sidebarCollapsed && <span className="truncate text-[13px] font-medium tracking-[0.01em]">{item.label}</span>}
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
        <div className={`shrink-0 border-t border-white/10 pt-3 ${sidebarCollapsed ? "px-2" : "px-4"}`}>
          <button onClick={() => window.dispatchEvent(new Event("powercare:open-feedback"))} className="group flex h-10 w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 text-white/60 transition hover:border-landing-gold/40 hover:bg-white/[0.07] hover:text-white">
            <MessageSquare className="h-4 w-4 shrink-0 text-landing-gold-light" strokeWidth={1.7} />
            {!sidebarCollapsed && <span className="truncate text-xs font-medium">{lang === "ar" ? "التقييم والاقتراحات" : "Feedback & suggestions"}</span>}
          </button>
        </div>
        <button
          onClick={() => navigate(`/app/employees/${currentUser.id}`)}
          title={t("viewProfile")}
          className={`mb-4 mt-2 flex shrink-0 items-center rounded-md border border-landing-gold/25 bg-white/[0.05] p-2.5 text-start transition hover:border-landing-gold/50 hover:bg-white/[0.08] ${sidebarCollapsed ? "mx-2 justify-center" : "mx-4 gap-3"}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-landing-gold text-xs font-semibold text-primary ring-1 ring-white/20">
            {currentUser.profile?.avatarUrl ? (
              <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </span>
          {!sidebarCollapsed && <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">{currentUser.name}</span>
              <span className="mt-0.5 block truncate text-[9px] uppercase tracking-wider text-white/40">{t("viewProfile")}</span>
            </span>
            <UserCircle className="h-4 w-4 shrink-0 text-landing-gold-light" />
          </>}
        </button>
      </aside>
      <button
        type="button"
        onClick={() => setSidebarCollapsed((value) => !value)}
        title={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
        className={`fixed top-[76px] z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-landing-gold/40 bg-primary text-landing-gold-light shadow-lg transition-[left,right] duration-200 hover:bg-sidebar-accent md:flex ${dir === "rtl" ? (sidebarCollapsed ? "right-3" : "right-[256px]") : (sidebarCollapsed ? "left-3" : "left-[256px]")}`}
        aria-label={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
      >
        {sidebarCollapsed ? (dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : (dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)}
      </button>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="powercare-global-header sticky top-0 z-40 overflow-visible border-b border-accent/35 bg-card/95 pt-safe text-foreground shadow-lg backdrop-blur-xl">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <div className="flex h-16 items-center justify-between px-4 md:h-[76px] md:px-8">
            {/* Mobile nav (scrollable pills) */}
            <div className="md:hidden flex min-w-0 items-center gap-2 text-foreground">
              <BackButton />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card p-1 shadow-sm"><Logo size={32} className="h-full w-full" /></span>
              <CompanyNameEditor company={company} data={data} currentUser={currentUser} lang={lang} compact />
            </div>

            <div className="hidden min-w-0 items-center gap-4 text-foreground md:flex">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-card p-1.5 shadow-sm">
                <Logo size={38} className="h-full w-full" />
              </span>
              <span className="h-9 w-px shrink-0 bg-border" />
              <div className="min-w-0">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">NiroVera</p>
                <CompanyNameEditor company={company} data={data} currentUser={currentUser} lang={lang} />
                <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{t("welcome")}, {currentUser.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => setSearchOpen(true)} aria-label={lang === "ar" ? "البحث العام" : "Global search"} className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md text-foreground hover:bg-muted md:px-3"><Search className="h-5 w-5 text-accent" /><span className="hidden text-xs font-medium text-muted-foreground lg:inline">⌘K</span></button>
              <SyncStatusIndicator isSyncing={isSyncing} />
              <ThemeToggle />
              {/* Language */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 max-md:min-w-[44px] max-md:min-h-[44px] rounded-md text-sm font-medium text-foreground hover:bg-muted font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="relative p-2 max-md:min-w-[44px] max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="flex items-center justify-center gap-2 px-2 py-1.5 max-md:min-w-[44px] max-md:min-h-[44px] rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium overflow-hidden">
                    {currentUser.profile?.avatarUrl ? (
                      <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-body font-medium max-w-[120px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 hidden sm:block" />
                </button>
                {userOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-64 bg-card text-foreground border border-border rounded-md shadow-xl z-50`}>
                    <button
                      onClick={() => { navigate(`/app/employees/${currentUser.id}`); setUserOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted text-start"
                    >
                      <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium overflow-hidden shrink-0">
                        {currentUser.profile?.avatarUrl ? (
                          <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          currentUser.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{currentUser.name}</p>
                        <p className="text-xs text-accent">{t("viewProfile")}</p>
                      </div>
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

        <main className="flex-1 p-4 pb-28 md:p-8 lg:p-10">
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