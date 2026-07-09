import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, getCompanyData } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, ListTodo, ShieldQuestion, Radio,
  Users, HardHat, CalendarRange, Bell, LogOut, Globe, ChevronDown, UserCircle,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Layout({ children }) {
  const { t, lang, setLang, dir, languages } = useI18n();
  const { currentUser, company, data, switchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

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
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listNotifications",
          userId: currentUser.id,
        });
        const remote = res.data?.notifications || [];
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
      } catch {
        // Supabase not configured or unreachable — silent
      }
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id, company?.id]);

  if (!currentUser || !data) return children;

  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: t("dashboard"), end: true },
    { to: "/app/tasks", icon: ListTodo, label: t("myTasks") },

    { to: "/app/anonymous", icon: ShieldQuestion, label: t("anonymous") },
    { to: "/app/stations", icon: Radio, label: t("stations") },
    { to: "/app/employees", icon: Users, label: t("employees") },
    { to: "/app/safety", icon: HardHat, label: t("safety") },
    { to: "/app/plans", icon: CalendarRange, label: t("plans") },
  ];

  const myNotifs = data.notifications.filter((n) => n.userId === currentUser.id);
  const unread = myNotifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    updateCompany(company.id, (d) => {
      d.notifications.forEach((n) => {
        if (n.userId === currentUser.id) n.read = true;
      });
    });
  };

  const sidebarSide = dir === "rtl" ? "right-0" : "left-0";

  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 ${sidebarSide} top-0 h-screen ${dir === "rtl" ? "border-l" : "border-r"} border-border bg-card sticky`}>
        <div className="px-6 py-6 flex items-center gap-2 border-b border-border">
          <Logo size={36} />
          <div>
            <p className="font-heading font-semibold text-lg leading-none">{t("appName")}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[160px]">{company.name}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">{t("demoNote")}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            {/* Mobile nav (scrollable pills) */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Logo size={32} className="shrink-0" />
            </div>

            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground font-body">
                {t("welcome")}, <span className="text-foreground font-medium">{currentUser.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Language */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-muted text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="relative p-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("notifications")}
                >
                  <Bell className="w-5 h-5" strokeWidth={1.75} />
                  {unread > 0 && (
                    <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-destructive" />
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
                          <div key={n.id} className={`px-4 py-3 border-b border-border/60 ${n.read ? "opacity-60" : ""}`}>
                            <p className="text-sm font-body">{n.text}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.createdAt).toLocaleString(lang)}
                            </p>
                          </div>
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
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                    {currentUser.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3 h-3 hidden sm:block" />
                </button>
                {userOpen && (
                  <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-64 bg-card border border-border rounded-md shadow-xl z-50`}>
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{t(currentUser.role)}</p>
                    </div>
                    <div className="px-2 py-2 max-h-60 overflow-y-auto">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("switchUser")}</p>
                      {data.employees.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => { switchUser(e.id); setUserOpen(false); }}
                          className={`w-full text-start px-2 py-1.5 rounded text-sm font-body flex items-center gap-2 hover:bg-muted ${
                            e.id === currentUser.id ? "text-accent" : "text-foreground"
                          }`}
                        >
                          <UserCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{e.name}</span>
                          <span className="ms-auto text-[10px] text-muted-foreground">{t(e.role)}</span>
                        </button>
                      ))}
                    </div>
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

          {/* Mobile nav row */}
          <div className="md:hidden flex items-center gap-1 overflow-x-auto px-3 pb-2 no-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body whitespace-nowrap ${
                    isActive ? "bg-foreground text-background" : "bg-muted text-foreground/70"
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}