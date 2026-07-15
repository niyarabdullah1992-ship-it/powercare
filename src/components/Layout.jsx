import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { RefreshCw } from "lucide-react";
import { updateCompany, getCompanyData } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, ListTodo, ShieldQuestion, Radio,
  Users, Bell, LogOut, Globe, ChevronDown, UserCircle, Trophy, UserCog, Megaphone, MessageSquare, FileBarChart2, FileText, PenLine, ClipboardCheck, X, FolderOpen, Sparkles, CalendarDays, HelpCircle, BookOpen, Calendar, Gauge,
} from "lucide-react";
import PlannerReminders from "@/components/individual/PlannerReminders";
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

export default function Layout({ children }) {
  const { t, lang, setLang, dir, languages } = useI18n();
  const { currentUser, company, data, logout, isSyncing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const notificationPollInFlightRef = useRef(false);
  const [navOrder, setNavOrder] = useState([]);

  useEffect(() => {
    if (!company) return;
    const saved = localStorage.getItem(`powercare_nav_order_${company.id}`);
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

  // Real-time notification polling (Supabase → local bell)
  useEffect(() => {
    if (!currentUser || !company) return;
    const poll = async () => {
      if (notificationPollInFlightRef.current || document.visibilityState !== "visible" || navigator.onLine === false) return;
      notificationPollInFlightRef.current = true;
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listNotifications",
          userId: currentUser.id,
        });
        const remote = (res.data?.notifications || []).filter((notification) =>
          shouldShowNotification(notification.message, data)
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
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, company?.id]);

  if (!currentUser || !data) return children;

  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: t("dashboard"), end: true },
    { to: "/app/executive", icon: Gauge, label: lang === "ar" ? "اللوحة التنفيذية" : "Executive" },
    { to: "/app/daily-report", icon: FileText, label: t("reports") },
    { to: "/app/tasks", icon: ListTodo, label: t("myTasks") },
    { to: "/app/attendance", icon: ClipboardCheck, label: t("attendanceScheduling") },
    { to: "/app/planner", icon: CalendarDays, label: t("dayPlanner") },
    { to: "/app/journal", icon: BookOpen, label: t("lifeJournal") },
    { to: "/app/calendar", icon: Calendar, label: t("monthlyCalendar") },
    { to: "/app/chat", icon: MessageSquare, label: t("chat") },
    { to: "/app/files", icon: FolderOpen, label: t("files") },
    { to: "/app/signing", icon: PenLine, label: t("fileSigning") },
    { to: "/app/assistant", icon: Sparkles, label: t("aiAssistant") },
    { to: "/app/complaints", icon: Megaphone, label: t("allComplaints") },
    { to: "/app/employees", icon: Users, label: t("employees") },
    { to: "/app/stations", icon: Radio, label: t("stations") },
    { to: "/app/hr", icon: UserCog, label: t("hr") },
    { to: "/app/performance", icon: Trophy, label: t("performance") },
    { to: "/app/reports", icon: FileBarChart2, label: t("tasksReport") },
    { to: "/app/help", icon: HelpCircle, label: t("userGuide") },
  ];

  // Role-based visibility: each user only sees the sections their role needs.
  const allowedNav = allowedNavFor(currentUser, data?.plan || company?.plan);
  const visibleNavItems = navItems.filter((i) => allowedNav.has(i.to));

  const orderKeys = navOrder.length ? navOrder : visibleNavItems.map((i) => i.to);
  const orderedNavItems = [
    ...orderKeys.map((to) => visibleNavItems.find((i) => i.to === to)).filter(Boolean),
    ...visibleNavItems.filter((i) => !orderKeys.includes(i.to)),
  ];

  const onNavDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedNavItems);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const newOrder = items.map((i) => i.to);
    setNavOrder(newOrder);
    if (company) localStorage.setItem(`powercare_nav_order_${company.id}`, JSON.stringify(newOrder));
  };

  const myNotifs = data.notifications.filter(
    (notification) => notification.userId === currentUser.id && shouldShowNotification(notification.text, data)
  );
  const unread = myNotifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    updateCompany(company.id, (d) => {
      d.notifications.forEach((n) => {
        if (n.userId === currentUser.id) n.read = true;
      });
    });
  };

  const dismissNotification = (id) => {
    updateCompany(company.id, (d) => {
      d.notifications = d.notifications.filter((n) => n.id !== id);
    });
  };

  // Clicking a notification marks it read and jumps to the page it refers to.
  const openNotification = (n) => {
    updateCompany(company.id, (d) => {
      const target = d.notifications.find((x) => x.id === n.id);
      if (target) target.read = true;
    });
    setNotifOpen(false);
    navigate(routeForNotification(n.text));
  };

  const sidebarSide = dir === "rtl" ? "right-0" : "left-0";

  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      {/* Sidebar — slim dark icon rail (WorkForce-style) */}
      <aside className={`hidden md:flex flex-col items-center w-[76px] ${sidebarSide} top-0 h-screen sticky bg-landing-olive pt-safe z-40`}>
        <div className="py-5 flex items-center justify-center">
          <span className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
            <Logo size={30} />
          </span>
        </div>
        <DragDropContext onDragEnd={onNavDragEnd}>
          <Droppable droppableId="sidebar-nav">
            {(provided) => (
              <nav ref={provided.innerRef} {...provided.droppableProps} className="flex-1 w-full px-3 py-2 flex flex-col items-center gap-1.5 overflow-y-auto no-scrollbar no-select">
                {orderedNavItems.map((item, index) => (
                  <Draggable key={item.to} draggableId={item.to} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`group relative ${dragSnapshot.isDragging ? "opacity-90" : ""}`}
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          title={item.label}
                          className={({ isActive }) =>
                            `flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
                              isActive
                                ? "bg-landing-gold text-white shadow-lg shadow-black/20"
                                : "text-white/45 hover:bg-white/10 hover:text-white"
                            }`
                          }
                        >
                          <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </NavLink>
                        {/* Hover label */}
                        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${dir === "rtl" ? "right-full mr-2" : "left-full ml-2"} whitespace-nowrap rounded-md bg-landing-olive text-white text-xs font-body px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50`}>
                          {item.label}
                        </span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </nav>
            )}
          </Droppable>
        </DragDropContext>
        <button
          onClick={() => navigate(`/app/employees/${currentUser.id}`)}
          title={t("viewProfile")}
          className="mb-5 mt-2 w-10 h-10 rounded-full ring-2 ring-white/20 hover:ring-landing-gold transition overflow-hidden bg-landing-gold text-white flex items-center justify-center text-sm font-medium shrink-0"
        >
          {currentUser.profile?.avatarUrl ? (
            <img src={currentUser.profile.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            currentUser.name.charAt(0)
          )}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border pt-safe">
          <div className="flex h-16 items-center justify-between px-4 md:h-[68px] md:px-8">
            {/* Mobile nav (scrollable pills) */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar">
              <BackButton />
              <Logo size={32} className="shrink-0" />
            </div>

            <div className="hidden md:block min-w-0">
              <p className="font-heading text-lg font-semibold leading-none truncate">{company.name || t("appName")}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1 truncate">
                {t("welcome")}, {currentUser.name}
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <SyncStatusIndicator isSyncing={isSyncing} />
              <ThemeToggle />
              {/* Language */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 max-md:min-w-[44px] max-md:min-h-[44px] rounded-md hover:bg-muted text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("language")}
                >
                  <Globe className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{languages.find((l) => l.code === lang)?.flag}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {langOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-44 bg-card border border-border rounded-md shadow-lg py-1 z-50`}>
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
                  className="relative p-2 max-md:min-w-[44px] max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-80 max-w-[90vw] bg-card border border-border rounded-md shadow-xl z-50`}>
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
                  className="flex items-center justify-center gap-2 px-2 py-1.5 max-md:min-w-[44px] max-md:min-h-[44px] rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-64 bg-card border border-border rounded-md shadow-xl z-50`}>
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

        <main className="flex-1 p-4 pb-28 md:p-8">
          {/* Native-style page transition between routes */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="mx-auto w-full max-w-[1600px]"
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

      {/* Native-style bottom tab bar (mobile only) */}
      <BottomTabBar />
      {String(data?.plan || company?.plan || "").toLowerCase() === "individual" && (
        <PlannerReminders data={data} />
      )}
      <ProductFeedbackPrompt companyId={company.id} role={currentUser.role} />
    </div>
  );
}