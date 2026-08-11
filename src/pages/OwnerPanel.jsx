import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { listCompanies, createCompany, deleteCompany, getCompanyData, setSession } from "@/lib/store";
import { logAudit } from "@/lib/auditLog";
import { Building2, Plus, Trash2, ShieldAlert, LogOut, LogIn, RefreshCw } from "lucide-react";
import Logo from "@/components/Logo";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import NewsBroadcast from "@/components/owner/NewsBroadcast";
import SubscribersDashboard from "@/components/owner/SubscribersDashboard";
import SaasAnalyticsDashboard from "@/components/owner/SaasAnalyticsDashboard";
import PlatformRoadmap from "@/components/owner/PlatformRoadmap";
import ProductFeedbackDashboard from "@/components/owner/ProductFeedbackDashboard";
import PlatformReportDashboard from "@/components/owner/PlatformReportDashboard";
import AuditLogDashboard from "@/components/owner/AuditLogDashboard";
import PlanManagement from "@/components/owner/PlanManagement";
import SubscriptionInvoicesDashboard from "@/components/owner/SubscriptionInvoicesDashboard";

export default function OwnerPanel() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter", allowedEmailDomain: "" });
  const [tab, setTab] = useState("analytics");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const refresh = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    const localCompanies = listCompanies();
    try {
      const accounts = await base44.entities.CompanyAccount.list("-created_date", 500);
      const merged = new Map(localCompanies.map((company) => [company.id, company]));
      accounts.forEach((account) => merged.set(account.companyId, {
        ...merged.get(account.companyId),
        id: account.companyId,
        name: account.name || merged.get(account.companyId)?.name || account.companyId,
        ownerEmail: account.ownerEmail,
        plan: account.plan,
      }));
      setCompanies([...merged.values()]);
    } catch {
      setCompanies(localCompanies);
    }
    setRefreshKey((value) => value + 1);
    if (showLoading) setRefreshing(false);
  };
  useEffect(() => {
    if (user?.role !== "admin") return;
    refresh();
    const interval = window.setInterval(() => refresh(), 30000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [user]);

  if (user === undefined) return null;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-landing-bg flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="font-heading text-xl font-semibold text-[#3a2f22]">
            {lang === "ar" ? "الوصول مرفوض" : "Access Denied"}
          </h2>
          <p className="text-sm text-[#3a2f22]/55 font-body">
            {lang === "ar" ? "هذه الصفحة مخصصة لمالك المنصة فقط." : "This page is reserved for the platform owner."}
          </p>
          <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold">
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.ownerEmail || !form.ownerPassword) return;
    const company = createCompany(form);
    logAudit(company.id, "company_created", user.email, `${user.email} created company "${company.name}" (${company.plan}).`);
    setForm({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter", allowedEmailDomain: "" });
    refresh();
  };

  const handleDelete = (id) => {
    const c = companies.find((x) => x.id === id);
    deleteCompany(id);
    logAudit(id, "company_deleted", user.email, `${user.email} deleted company "${c?.name || id}".`);
    refresh();
  };

  const handleEnter = (id) => {
    const data = getCompanyData(id);
    if (!data) return;
    const director = data.employees.find((e) => e.role === "director") || data.employees[0] || null;
    setSession({ companyId: id, userId: director ? director.id : null });
    navigate("/app");
  };

  return (
    <div className="owner-operations-panel min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="owner-operations-header border-b border-accent/40 bg-primary text-primary-foreground">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center gap-x-6 px-4 sm:px-6 md:flex-nowrap lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-primary-foreground/10"><Logo size={24} /></span>
            <span className="font-heading text-xl font-semibold tracking-tight text-primary-foreground">Power<span className="text-accent">Care</span></span>
          </div>
          <nav className="order-3 flex w-full overflow-x-auto no-scrollbar md:order-none md:w-auto md:flex-1 md:self-stretch">
            {[
              { key: "analytics", ar: "لوحة التحليلات", en: "Analytics" },
              { key: "subscriptions", ar: "إدارة الاشتراكات", en: "Subscriptions" },
              { key: "invoices", ar: "فواتير الاشتراكات", en: "Invoices" },
              { key: "plans", ar: "إدارة الباقات", en: "Plans" },
              { key: "report", ar: "تقرير المنصة", en: "Platform report" },
              { key: "companies", ar: "الشركات", en: "Companies" },
              { key: "feedback", ar: "التقييمات", en: "Feedback" },
              { key: "audit", ar: "سجل التدقيق", en: "Audit log" },
              { key: "roadmap", ar: "خارطة التطوير", en: "Roadmap" },
            ].map((tb) => (
              <button key={tb.key} onClick={() => setTab(tb.key)} className={`min-w-max border-b-2 px-4 py-3 text-xs font-medium transition-colors ${tab === tb.key ? "border-accent text-primary-foreground" : "border-transparent text-primary-foreground/55 hover:text-primary-foreground"}`}>
                {lang === "ar" ? tb.ar : tb.en}
              </button>
            ))}
          </nav>
          <div className="ms-auto flex shrink-0 items-center gap-3">
            <button onClick={() => refresh(true)} disabled={refreshing} className="flex items-center gap-1.5 text-xs text-primary-foreground/65 hover:text-primary-foreground disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /><span className="hidden lg:inline">{lang === "ar" ? "تحديث الكل" : "Refresh all"}</span>
            </button>
            <button onClick={() => base44.auth.logout("/")} className="flex items-center gap-1.5 rounded-full border border-accent/55 px-3 py-1.5 text-xs text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("logout")}</span>
            </button>
          </div>
        </div>
      </header>
      <div className="owner-operations-content mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {tab === "analytics" && <SaasAnalyticsDashboard key={`analytics-${refreshKey}`} lang={lang} />}
        {tab === "subscriptions" && <SubscribersDashboard key={`subscriptions-${refreshKey}`} ar={lang === "ar"} />}
        {tab === "invoices" && <SubscriptionInvoicesDashboard key={`invoices-${refreshKey}`} ar={lang === "ar"} />}
        {tab === "plans" && <PlanManagement ar={lang === "ar"} />}
        {tab === "report" && <PlatformReportDashboard key={`report-${refreshKey}`} ar={lang === "ar"} />}
        {tab === "roadmap" && <PlatformRoadmap ar={lang === "ar"} />}
        {tab === "feedback" && <ProductFeedbackDashboard key={`feedback-${refreshKey}`} ar={lang === "ar"} companies={companies} />}
        {tab === "audit" && <AuditLogDashboard key={`audit-${refreshKey}`} ar={lang === "ar"} companies={companies} />}

        {tab === "companies" && (<>
        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2 text-[#3a2f22]">
                <Building2 className="w-4 h-4" /> {t("companies")} ({companies.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {companies.length === 0 && <p className="text-sm text-[#3a2f22]/40 font-body">No companies yet.</p>}
              {companies.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-landing-bg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-[#3a2f22]">{c.name}</p>
                    <p className="text-xs text-[#3a2f22]/40 truncate">{c.ownerEmail} · {c.plan}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEnter(c.id)} title={lang === "ar" ? "دخول" : "Enter"} className="p-2 text-landing-gold hover:bg-white rounded-md">
                      <LogIn className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <ConfirmDeleteDialog
                      onConfirm={() => handleDelete(c.id)}
                      trigger={
                        <button className="p-2 text-red-500 hover:bg-white rounded-md">
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-[#3a2f22]/10">
            <h3 className="font-heading text-lg font-semibold flex items-center gap-2 text-[#3a2f22]">
              <Plus className="w-4 h-4" /> {t("createCompany")}
            </h3>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("companyName")} required
              className="w-full px-3 py-2 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
            <input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder={t("email")} required
              className="w-full px-3 py-2 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
            <input value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} placeholder={t("password")} required
              className="w-full px-3 py-2 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold">
              <option>Starter</option>
              <option>Professional</option>
              <option>Enterprise</option>
            </select>
            <input value={form.allowedEmailDomain} onChange={(e) => setForm({ ...form, allowedEmailDomain: e.target.value })} placeholder={t("allowedEmailDomain") + " (e.g. @acwa.com)"}
              className="w-full px-3 py-2 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("createCompany")}
            </button>
          </form>
        </div>

        <NewsBroadcast />


        </>)}
      </div>
    </div>
  );
}