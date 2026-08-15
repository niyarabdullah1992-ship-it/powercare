import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import { updateCompany, getCompanyData, getCompanyToken } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, ListTodo, ShieldQuestion, Search,
                  Bell, LogOut, ChevronDown, ChevronLeft, ChevronRight, Trophy, UserCog, MessageCircle, MessageSquare, FileText, PenLine, ClipboardCheck, FolderOpen, Sparkles, Banknote, Warehouse, ReceiptText, Camera, Briefcase, CalendarClock, CalendarOff, Network, Settings2, BarChart3,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Logo from "@/components/Logo";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import { allowedNavFor } from "@/lib/navVisibility";
import BottomTabBar from "@/components/mobile/BottomTabBar";
import BackButton from "@/components/mobile/BackButton";
import ProductFeedbackPrompt from "@/components/ProductFeedbackPrompt";
import { shouldShowNotification } from "@/lib/notificationFilters";
import { routeForNotification } from "@/lib/notificationRoute";
import GlobalSearch from "@/components/navigation/GlobalSearch";
import StationScopeControl from "@/components/navigation/StationScopeControl";
import SectionReportPicker from "@/components/reports/SectionReportPicker";
import StationQuickSwitch from "@/components/navigation/StationQuickSwitch";
import { OPEN_STATION_SWITCH_EVENT } from "@/hooks/useStationSwitcher";
import { setStationScope, getStationScope } from "@/lib/stationScopeStore";
import { visibleStations } from "@/lib/permissions";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { BORDER, CARD, INK, MUTED, NAVY, NAVY_FILL, SURFACE } from "@/lib/platformStyles";
import { THEME_CHANGE_EVENT, applyPlatformTheme, applyStoredPlatformTheme, persistPlatformTheme } from "@/lib/platformTheme";

export default function Layout({ children }) {
  const { t, lang, setLang, dir, languages } = useI18n();
  const { currentUser, company, data, logout, isSyncing } = useAuth();
  const { terms } = useOrgTerms();
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const notificationPollInFlightRef = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("powercare_sidebar_collapsed") === "true");
  const [navFold, setNavFold] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("powercare_nav_fold_v6") || "{}");
      return {
        workforce: raw.workforce !== false,
        compliance: raw.compliance !== false,
        money: raw.money !== false,
        admin: raw.admin !== false,
      };
    } catch {
      return { workforce: true, compliance: true, money: true, admin: true };
    }
  });
  const [scopeSwitchOpen, setScopeSwitchOpen] = useState(false);

  useEffect(() => {
    applyStoredPlatformTheme(company?.id);
    const onChange = (event) => {
      if (event?.detail) applyPlatformTheme(event.detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    if (!company?.id) {
      return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    }
    let cancelled = false;
    base44.functions.invoke("settings", { action: "getColorTheme", companyId: company.id })
      .then((res) => {
        const remote = res?.data?.colorTheme ?? res?.colorTheme;
        if (cancelled || !remote) return;
        applyPlatformTheme(persistPlatformTheme(remote, company.id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    };
  }, [company?.id]);

  useEffect(() => {
    localStorage.setItem("powercare_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("powercare_nav_fold_v6", JSON.stringify(navFold));
  }, [navFold]);

  useEffect(() => {
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Ctrl/Cmd+K searches; the same chord with Shift switches station in place.
  useEffect(() => {
    // Step only through stations this user may see — the same list the palette shows.
    const stepStation = (delta) => {
      const allowed = data && currentUser ? visibleStations(currentUser, data) : [];
      const ring = ["all", ...allowed.map((s) => String(s.id))];
      if (ring.length < 2) return;
      const at = ring.indexOf(getStationScope());
      setStationScope(ring[((at < 0 ? 0 : at) + delta + ring.length) % ring.length]);
    };
    const onKey = (event) => {
      const chord = event.metaKey || event.ctrlKey;
      if (chord && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(false);
        setScopeSwitchOpen(true);
        return;
      }
      if (chord && event.shiftKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        stepStation(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (chord && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    const openSwitch = () => setScopeSwitchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_STATION_SWITCH_EVENT, openSwitch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_STATION_SWITCH_EVENT, openSwitch);
    };
  }, [data, currentUser]);

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

  // Outstanding daily reports = stations without an approved filing today (Platform nav badge).
  const dailyReportBadge = (() => {
    const d = new Date();
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const stations = data?.stations || [];
    const filed = (data?.reports || []).filter((r) =>
      r && (r.kind === "daily" || r.type === "daily" || !r.kind)
      && (!r.dateKey || r.dateKey === dayKey),
    );
    const byStation = new Map(filed.map((r) => [String(r.stationId), r]));
    const open = stations.filter((st) => {
      const r = byStation.get(String(st.id));
      return !(r && r.approved);
    }).length;
    return open > 0 ? open : undefined;
  })();

  // Proof-cycle IA: Attendance → Tasks → Work proof → Signing, then people / care / money / institution.
  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: lang === "ar" ? "مركز القيادة" : "Command Center", end: true, category: "daily" },
    { to: "/app/attendance", icon: ClipboardCheck, label: lang === "ar" ? "الحضور والانصراف" : "Attendance", category: "daily" },
    { to: "/app/tasks", icon: ListTodo, label: lang === "ar" ? "المهام والعمليات" : "Operations", category: "daily" },
    { to: "/app/work-proof", icon: Camera, label: lang === "ar" ? "إثبات العمل" : "Work Proof", category: "daily" },
    { to: "/app/signing", icon: PenLine, label: lang === "ar" ? "التوقيع الرقمي" : "Digital Signing", category: "daily" },
    { to: "/app/daily-report", icon: FileText, label: lang === "ar" ? "التقرير اليومي" : "Daily Report", category: "daily", badge: dailyReportBadge },
    { to: "/app/reports", icon: BarChart3, label: lang === "ar" ? "التقارير والتحليلات" : "Reports & Analytics", category: "daily" },
    { to: "/app/chat", icon: MessageSquare, label: lang === "ar" ? "المحادثات التشغيلية" : "Operations Chat", category: "daily" },
    { to: "/app/shifts", icon: CalendarClock, label: lang === "ar" ? "الورديات" : "Shifts", category: "workforce", fold: "workforce" },
    { to: "/app/leave", icon: CalendarOff, label: lang === "ar" ? "طلبات الإجازة" : "Leave Requests", category: "workforce", fold: "workforce" },
    { to: "/app/hr", icon: UserCog, label: lang === "ar" ? "الموارد البشرية" : "Human Resources", category: "workforce", fold: "workforce" },
    { to: "/app/hiring", icon: Briefcase, label: lang === "ar" ? "التوظيف" : "Recruitment", category: "workforce", fold: "workforce" },
    { to: "/app/performance", icon: Trophy, label: lang === "ar" ? "الأداء" : "Performance", category: "workforce", fold: "workforce" },
    { to: "/app/org", icon: Network, label: lang === "ar" ? "الهيكل التنظيمي" : "Org Structure", category: "workforce", fold: "workforce" },
    { to: "/app/safety", icon: ShieldQuestion, label: lang === "ar" ? "السلامة HSE" : "Safety HSE", category: "compliance", fold: "compliance" },
    { to: "/app/complaints", icon: MessageCircle, label: lang === "ar" ? "صوت الموظف" : "Employee Voice", category: "compliance", fold: "compliance" },
    { to: "/app/payroll", icon: Banknote, label: lang === "ar" ? "الرواتب" : "Payroll", category: "money", fold: "money" },
    { to: "/app/expenses", icon: ReceiptText, label: lang === "ar" ? "المصروفات" : "Expenses", category: "money", fold: "money" },
    { to: "/app/inventory", icon: Warehouse, label: lang === "ar" ? "المخزون والأصول" : "Inventory & Assets", category: "money", fold: "money" },
    { to: "/app/files", icon: FolderOpen, label: lang === "ar" ? "الملفات" : "Files", category: "admin", fold: "admin" },
    { to: "/app/assistant", icon: Sparkles, label: lang === "ar" ? "المساعد الذكي" : "AI Assistant", category: "admin", fold: "admin" },
    { to: "/app/settings", icon: Settings2, label: lang === "ar" ? "إعدادات الشركة" : "Company Settings", category: "admin", fold: "admin" },
  ];

  const navGroupLabels = {
    daily: lang === "ar" ? "دورة الإثبات" : "Proof cycle",
    workforce: lang === "ar" ? "القوى العاملة" : "Workforce",
    compliance: lang === "ar" ? "الالتزام والرعاية" : "Care & compliance",
    money: lang === "ar" ? "المال والأصول" : "Money & assets",
    admin: lang === "ar" ? "المؤسسة" : "Institution",
  };
  const categoryOrder = ["daily", "workforce", "compliance", "money", "admin"];
  const foldableCategories = new Set(["workforce", "compliance", "money", "admin"]);

  const allowedNav = allowedNavFor(currentUser, data, company);
  const visibleNavItems = navItems.filter((i) => allowedNav.has(i.to));
  const orderedNavItems = [...visibleNavItems].sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
  );

  const activeFoldKey = orderedNavItems.find((item) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  })?.fold;

  const toggleFold = (key) => {
    setNavFold((prev) => ({ ...prev, [key]: !prev[key] }));
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
    updateCompany(company.id, (d) => {
      const target = d.notifications.find((x) => x.id === n.id);
      if (target) target.read = true;
    });
    setNotifOpen(false);
    navigate(n.to || routeForNotification(n.text));
  };

  const sidebarSide = dir === "rtl" ? "right-0" : "left-0";

  const pageMeta = {
    "/app": {
      title: lang === "ar" ? "مركز القيادة" : "Command Center",
      sub: lang === "ar" ? "نظرة واحدة على جاهزية التشغيل الآن" : "One view of operational readiness right now",
    },
    "/app/hr": {
      title: lang === "ar" ? "الموارد البشرية" : "Human Resources",
      sub: lang === "ar"
        ? `${(data.employees || []).length} موظفًا · ${(data.stations || []).length} فروع`
        : `${(data.employees || []).length} employees · ${(data.stations || []).length} stations`,
    },
    "/app/org": {
      title: lang === "ar" ? "الهيكل التنظيمي" : "Org Structure",
      sub: lang === "ar" ? "منه تُشتق الصلاحيات وسلسلة التصعيد" : "Permissions and the escalation chain derive from it",
    },
    "/app/settings": {
      title: lang === "ar" ? "إعدادات الشركة" : "Company Settings",
      sub: lang === "ar" ? "الحساب والنطاق الجغرافي والصلاحيات" : "Account, geofences and permissions",
    },
    "/app/hiring": {
      title: lang === "ar" ? "التوظيف" : "Recruitment",
      sub: lang === "ar" ? "من طلب التوظيف إلى أول يوم عمل — بمهلة لكل مرحلة" : "From requisition to first day — with a deadline on every stage",
    },
    "/app/attendance": {
      title: lang === "ar" ? "الحضور والانصراف" : "Attendance",
      sub: lang === "ar" ? "يضع حضر بنفسه — يغذي المهام والرواتب" : "Marks present in person — feeds tasks and payroll",
    },
    "/app/shifts": {
      title: lang === "ar" ? "الورديات" : "Shifts",
      sub: lang === "ar" ? "جدول شهري لكل فرع · الفحص النظامي قبل النشر" : "A monthly schedule per station · statutory checks before publishing",
    },
    "/app/leave": {
      title: lang === "ar" ? "طلبات الإجازة" : "Leave Requests",
      sub: lang === "ar" ? "الرصيد يُخصم عند الاعتماد فقط" : "Balance is deducted only on approval",
    },
    "/app/payroll": {
      title: lang === "ar" ? "الرواتب" : "Payroll",
      sub: lang === "ar"
        ? "دورة نظامية: تجهيز البنود · المادة 90 و107 · الاعتماد · حماية الأجور قبل اليوم 3"
        : "Statutory cycle: prepare lines · Art. 90 & 107 · approve · wage protection before day 3",
    },
    "/app/performance": {
      title: lang === "ar" ? "الأداء" : "Performance",
      sub: lang === "ar" ? "مبني على بيانات فعلية لا تقييم يدوي" : "From actual data, not manual ratings",
    },
    "/app/tasks": {
      title: lang === "ar" ? "المهام والعمليات" : "Operations",
      sub: lang === "ar" ? "جهد وإثبات · مراجعة بسبب · تصعيد عند احتراق المهلة" : "Effort and proof · review with reason · escalate when the quota burns",
    },
    "/app/daily-report": {
      title: lang === "ar" ? "التقرير اليومي" : "Daily Report",
      sub: lang === "ar" ? "تقرير واحد لكل فرع، يُعتمد قبل نهاية الوردية" : "One report per station, approved before the shift ends",
    },
    "/app/reports": {
      title: lang === "ar" ? "التقارير والتحليلات" : "Reports & Analytics",
      sub: lang === "ar" ? "مكتبة التقارير والجدولة التلقائية" : "Report library and automated scheduling",
    },
    "/app/inventory": {
      title: lang === "ar" ? "المخزون والأصول" : "Inventory & Assets",
      sub: lang === "ar" ? "شراء · رصيد الفرع · صرف للعمل" : "Purchase · station balance · issue to work",
    },
    "/app/expenses": {
      title: lang === "ar" ? "المصروفات" : "Expenses",
      sub: lang === "ar" ? "مطالبات ومصروفات تشغيلية مقابل ميزانية كل فرع" : "Claims and operating spend against each station's budget",
    },
    "/app/safety": {
      title: lang === "ar" ? "السلامة HSE" : "Safety HSE",
      sub: lang === "ar" ? "المخاطر المفتوحة وسجل الحوادث" : "Open hazards and incident log",
    },
    "/app/files": {
      title: lang === "ar" ? "الملفات" : "Files",
      sub: lang === "ar" ? "مستندات مقيّدة بالصلاحية ومربوطة بالفرع" : "Permission-scoped documents linked to their station",
    },
    "/app/signing": {
      title: lang === "ar" ? "التوقيع الرقمي" : "Digital Signing",
      sub: lang === "ar" ? "فردي · جماعي · الصندوق · تحقق" : "Individual · group · inbox · verify",
    },
    "/app/work-proof": {
      title: lang === "ar" ? "إثبات العمل" : "Work Proof",
      sub: lang === "ar" ? "دليل ميداني + إفصاح العميل ورابط تحقق" : "Field evidence + client disclosure and a verify link",
    },
    "/app/help": {
      title: lang === "ar" ? "دليل الاستخدام" : "User guide",
      sub: lang === "ar" ? "مرجع الأقسام من الدخول حتى الأمن" : "Section reference from sign-in through security",
    },
    "/app/complaints": {
      title: lang === "ar" ? "صوت الموظف" : "Employee Voice",
      sub: lang === "ar" ? "اقتراح · شكوى · بلاغ مجهول" : "Suggestion · complaint · anonymous report",
    },
    "/app/assistant": {
      title: lang === "ar" ? "المساعد الذكي" : "AI Assistant",
      sub: lang === "ar" ? "يقرأ بياناتك ويجيب بالمصدر" : "Reads your data, answers with sources",
    },
    "/app/chat": {
      title: lang === "ar" ? "المحادثات التشغيلية" : "Operations Chat",
      sub: lang === "ar" ? "قنوات لكل فرع · الرسائل جزء من سجل التشغيل" : "A channel per station · messages are part of the operations log",
    },
  };
  const resolvePageMeta = () => {
    const path = location.pathname;
    if (pageMeta[path]) return pageMeta[path];
    // An employee file is about a named person — the header must say whose file
    // is open, not fall back to the product name.
    const employeeMatch = path.match(/^\/app\/employees\/([^/]+)/);
    if (employeeMatch) {
      const person = (data?.employees || []).find((e) => e.id === employeeMatch[1]);
      const station = (data?.stations || []).find((s) => s.id === person?.stationId);
      const roleLabel = person ? (t(person.role) || person.role) : "";
      return {
        title: person?.name || (lang === "ar" ? "ملف موظف" : "Employee file"),
        sub: person
          ? [roleLabel, station?.name].filter(Boolean).join(" · ")
            || (lang === "ar" ? "الملف الوظيفي والإسناد" : "Employment file and assignment")
          : (lang === "ar" ? "لا يوجد موظف بهذا المعرّف في هذه الشركة" : "No employee with this id in this company"),
      };
    }
    const hit = Object.keys(pageMeta).find((key) => key !== "/app" && path.startsWith(key));
    return hit
      ? pageMeta[hit]
      : { title: lang === "ar" ? "نيروفيرا" : "NiroVera", sub: lang === "ar" ? "منظومة الموارد البشرية" : "HR operating system" };
  };
  const { title: pageTitle, sub: pageSubtitle } = resolvePageMeta();
  // period footer removed from design shell — user chip only (L93–99)
  const roleTitle = currentUser.role === "director" || currentUser.role === "owner"
    ? terms.ceo
    : (t(currentUser.role) || currentUser.role);
  const roleInitials = currentUser.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

  return (
    <div className="powercare-shell flex min-h-screen" dir={dir}>
      {/* Desktop navigation — Platform.dc.html light shell */}
      {/* Platform.dc.html L54–99 sidebar — literal metrics */}
      <aside
        data-nv="sidebar"
        className={`corporate-sidebar hidden md:flex flex-col ${sidebarCollapsed ? "w-0 opacity-0 pointer-events-none" : ""} ${sidebarSide} top-0 z-40 h-screen sticky overflow-hidden pt-safe`}
        style={{
          width: sidebarCollapsed ? 0 : "250px",
          flexShrink: 0,
          background: CARD,
          borderInlineEnd: `1px solid ${BORDER}`,
          transition: "width .2s, opacity .2s",
        }}
      >
        <div style={{ padding: sidebarCollapsed ? "18px 8px 14px" : "18px 16px 14px", display: "flex", alignItems: "center", gap: "10px", justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
            <Logo size={22} wordmark={false} />
          </span>
          {!sidebarCollapsed && (
            <div data-nv="wide" style={{ lineHeight: 1.15, minWidth: 0 }}>
              <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", color: INK }}>NiroVera</div>
              <div style={{ fontSize: "10px", color: MUTED, letterSpacing: "0.04em" }}>
                {lang === "ar" ? "حزمة التشغيل" : "Operations Suite"}
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: sidebarCollapsed ? "4px 8px 12px" : "4px 10px 12px", display: "flex", flexDirection: "column", gap: "2px" }} className="no-scrollbar no-select">
          {categoryOrder.map((category) => {
            const items = orderedNavItems.filter((item) => item.category === category);
            if (!items.length) return null;
            const foldKey = foldableCategories.has(category) ? category : null;
            const folded = !!(foldKey && navFold[foldKey] && activeFoldKey !== foldKey);
            return (
              <div key={category} data-nv="navgroup">
                {!sidebarCollapsed && (
                  foldKey ? (
                    <div style={{ padding: "14px 10px 6px" }}>
                      <button
                        type="button"
                        onClick={() => toggleFold(foldKey)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          padding: 0,
                          textAlign: "start",
                        }}
                      >
                        <span style={{ fontSize: "11px", letterSpacing: "0.04em", color: INK, fontWeight: 600 }}>
                          {navGroupLabels[category]}
                        </span>
                        <span style={{ flex: 1 }} />
                        <span dir="ltr" style={{ fontSize: "12px", color: MUTED, lineHeight: 1 }}>{folded ? "+" : "−"}</span>
                      </button>
                    </div>
                  ) : (
                    <div data-nv="navgroup" style={{ padding: "14px 10px 6px", fontSize: "11px", letterSpacing: "0.04em", color: INK, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
                      {navGroupLabels[category]}
                    </div>
                  )
                )}
                {items.map((item) => {
                  const hideInExpanded = folded && !sidebarCollapsed;
                  const aliasActive = (item.aliases || []).some(
                    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
                  );
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      data-nv="navbtn"
                      data-fold={item.fold || undefined}
                      style={({ isActive }) => {
                        const active = isActive || aliasActive;
                        return {
                        display: hideInExpanded ? "none" : "flex",
                        alignItems: "center",
                        gap: sidebarCollapsed ? 0 : "10px",
                        justifyContent: sidebarCollapsed ? "center" : "flex-start",
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "9px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "13px",
                        textAlign: dir === "rtl" ? "right" : "left",
                        textDecoration: "none",
                        transition: "background .12s",
                        background: active ? "var(--nv-accent-soft)" : "transparent",
                        color: active ? "var(--nv-accent-deep)" : MUTED,
                        fontWeight: active ? 600 : 400,
                      };
                      }}
                    >
                      <span style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <item.icon style={{ width: 18, height: 18 }} strokeWidth={1.7} />
                      </span>
                      {!sidebarCollapsed && (
                        <span data-nv="wide" style={{ flex: 1, textAlign: dir === "rtl" ? "right" : "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.label}
                        </span>
                      )}
                      {!sidebarCollapsed && item.badge != null && (
                        <span
                          dir="ltr"
                          style={{
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 5px",
                            borderRadius: "9px",
                            background: "var(--nv-accent-soft)",
                            color: "var(--nv-accent-deep)",
                            fontSize: "10px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'IBM Plex Sans',sans-serif",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => navigate(`/app/employees/${currentUser.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
                textAlign: "start",
              }}
            >
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: NAVY_FILL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>
                {currentUser.profile?.avatarUrl ? (
                  <img src={currentUser.profile.avatarUrl} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  roleInitials
                )}
              </span>
              <span data-nv="wide" style={{ flex: 1, lineHeight: 1.3, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: INK }}>{currentUser.name}</span>
                <span style={{ display: "block", fontSize: "10px", color: "#A8B4C8" }}>{roleTitle}</span>
              </span>
            </button>
          </div>
        )}
      </aside>
      <button
        type="button"
        onClick={() => setSidebarCollapsed((value) => !value)}
        title={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
        className={`nv-collapse-btn fixed top-[70px] z-50 hidden items-center justify-center transition-[left,right] duration-200 md:flex ${dir === "rtl" ? (sidebarCollapsed ? "right-3" : "right-[239px]") : (sidebarCollapsed ? "left-3" : "left-[239px]")}`}
        aria-label={sidebarCollapsed ? (lang === "ar" ? "إظهار القائمة" : "Show navigation") : (lang === "ar" ? "إخفاء القائمة" : "Hide navigation")}
      >
        {sidebarCollapsed ? (dir === "rtl" ? <ChevronLeft strokeWidth={1.75} /> : <ChevronRight strokeWidth={1.75} />) : (dir === "rtl" ? <ChevronRight strokeWidth={1.75} /> : <ChevronLeft strokeWidth={1.75} />)}
      </button>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — Platform.dc.html L103–107 title+subtitle literal */}
        <header
          data-nv="pad"
          className="powercare-global-header sticky top-0 z-40 overflow-visible pt-safe"
          style={{
            height: "58px",
            flexShrink: 0,
            background: CARD,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "0 22px",
            color: INK,
          }}
        >
          <div className="flex min-w-0 items-center gap-2 md:hidden" style={{ flex: 1, minWidth: 0 }}>
            <BackButton />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle}</div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageSubtitle}</div>
            </div>
          </div>

          <div className="hidden md:block" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle}</div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageSubtitle}</div>
          </div>

            {/* Scope chrome — Platform.dc.html L108–125 metrics, one station picker */}
            <StationScopeControl />

            <div className="hidden md:flex" style={{ alignItems: "center", minWidth: 0, flexShrink: 1 }}>
              <SectionReportPicker lang={lang} compact />
            </div>

            {/* topmeta — Platform.dc.html L127–137 search + live + lang */}
            <div
              data-nv="topmeta"
              className="hidden md:flex"
              style={{ alignItems: "center", gap: "8px", flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  height: "34px",
                  padding: "0 12px",
                  borderRadius: "9px",
                  border: `1px solid ${BORDER}`,
                  background: SURFACE,
                  minWidth: "140px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "start",
                }}
              >
                <span style={{ color: MUTED, fontSize: "12px" }}>⌕</span>
                <span style={{ fontSize: "12px", color: MUTED }}>
                  {lang === "ar" ? "ابحث أو اكتب أمرًا" : "Search or type a command"}
                </span>
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "34px",
                  padding: "0 11px",
                  borderRadius: "9px",
                  background: "var(--nv-accent-soft)",
                  border: "1px solid var(--nv-accent-border)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--nv-accent)",
                    animation: "nvPulse 2.2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--nv-accent-deep)",
                  }}
                >
                  {lang === "ar" ? "مباشر" : "Live"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={lang === "ar" ? "البحث العام" : "Global search"}
              className="flex md:hidden"
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "34px",
                width: "34px",
                borderRadius: "9px",
                border: `1px solid ${BORDER}`,
                background: CARD,
                color: MUTED,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              <Search style={{ width: 16, height: 16 }} />
            </button>

            <SyncStatusIndicator isSyncing={isSyncing} />
            <ThemeToggle />

            <div className="relative" ref={langRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                aria-label={t("language")}
                style={{
                  flexShrink: 0,
                  height: "34px",
                  minWidth: "38px",
                  padding: "0 11px",
                  borderRadius: "9px",
                  border: `1px solid ${BORDER}`,
                  background: CARD,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: MUTED,
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans',sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--nv-accent)";
                  e.currentTarget.style.color = "var(--nv-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.color = MUTED;
                }}
              >
                {lang === "ar" ? "EN" : "ع"}
              </button>
              {langOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    insetInlineEnd: 0,
                    zIndex: 50,
                    marginTop: "6px",
                    width: "176px",
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "11px",
                    boxShadow: "0 14px 32px rgba(20,40,75,.14)",
                    padding: "5px",
                  }}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "9px 11px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        textAlign: "start",
                        background: lang === l.code ? SURFACE : "transparent",
                        color: lang === l.code ? INK : MUTED,
                        fontWeight: lang === l.code ? 600 : 400,
                      }}
                    >
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginInlineStart: "auto" }}>
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label={t("notifications")}
                  style={{
                    position: "relative",
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    border: notifOpen ? `1px solid ${NAVY}` : `1px solid ${BORDER}`,
                    background: notifOpen ? NAVY : CARD,
                    color: notifOpen ? "#fff" : MUTED,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Bell style={{ width: 16, height: 16 }} strokeWidth={1.75} />
                  {unread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        insetInlineEnd: -4,
                        minWidth: 16,
                        height: 16,
                        padding: "0 4px",
                        borderRadius: 20,
                        background: "#DC2626",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'IBM Plex Sans',sans-serif",
                        border: "2px solid #fff",
                      }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    style={{
                      position: "absolute",
                      marginTop: 8,
                      [dir === "rtl" ? "left" : "right"]: 0,
                      zIndex: 50,
                    }}
                  >
                    <NotificationPanel
                      items={myNotifs}
                      unread={unread}
                      lang={lang}
                      t={t}
                      onOpen={openNotification}
                      onDismiss={dismissNotification}
                      onMarkAll={markAllRead}
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((o) => !o)}
                  aria-expanded={userOpen}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 36,
                    padding: "0 6px 0 4px",
                    borderRadius: 10,
                    border: userOpen ? "1px solid var(--nv-accent-border)" : `1px solid ${BORDER}`,
                    background: userOpen ? "var(--nv-accent-soft)" : CARD,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: NAVY_FILL,
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {currentUser.profile?.avatarUrl ? (
                      <img src={currentUser.profile.avatarUrl} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      roleInitials
                    )}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 sm:block" style={{ color: "#A8B4C8" }} strokeWidth={1.75} />
                </button>
                {userOpen && (
                  <div
                    style={{
                      position: "absolute",
                      marginTop: 8,
                      [dir === "rtl" ? "left" : "right"]: 0,
                      width: 260,
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 14,
                      boxShadow: "0 14px 32px rgba(20,40,75,.14)",
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => { navigate(`/app/employees/${currentUser.id}`); setUserOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px",
                        border: "none",
                        borderBottom: `1px solid ${BORDER}`,
                        background: SURFACE,
                        cursor: "pointer",
                        textAlign: "start",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          background: NAVY_FILL,
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {currentUser.profile?.avatarUrl ? (
                          <img src={currentUser.profile.avatarUrl} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          roleInitials
                        )}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {currentUser.name}
                        </span>
                        <span style={{ display: "block", marginTop: 2, fontSize: 11, fontWeight: 600, color: "var(--nv-accent)" }}>
                          {t("viewProfile")}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { window.dispatchEvent(new Event("powercare:open-feedback")); setUserOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        border: "none",
                        background: CARD,
                        color: INK,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "start",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          background: "var(--nv-accent-soft)",
                          color: "var(--nv-accent)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MessageSquare style={{ width: 14, height: 14 }} strokeWidth={1.75} />
                      </span>
                      {lang === "ar" ? "التقييم والاقتراحات" : "Feedback & suggestions"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { logout(); navigate("/"); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        border: "none",
                        borderTop: `1px solid ${BORDER}`,
                        background: CARD,
                        color: "#DC2626",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "start",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          background: "#FEF2F2",
                          color: "#DC2626",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <LogOut style={{ width: 14, height: 14 }} strokeWidth={1.75} />
                      </span>
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
        </header>

        <main className="platform-main-scroll flex-1 overflow-y-auto p-5 pb-28 md:px-[22px] md:pb-10 md:pt-5">
          <div className="powercare-interior-page mx-auto w-full max-w-[1600px]">
            <PageErrorBoundary resetKey={location.pathname}>{children}</PageErrorBoundary>
          </div>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} items={orderedNavItems} data={data} currentUser={currentUser} lang={lang} />
      <StationQuickSwitch open={scopeSwitchOpen} onClose={() => setScopeSwitchOpen(false)} />
      {/* Native-style bottom tab bar (mobile only) */}
      <BottomTabBar />
      <ProductFeedbackPrompt companyId={company.id} role={currentUser.role} />
    </div>
  );
}