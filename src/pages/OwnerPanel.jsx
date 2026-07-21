import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { listCompanies, createCompany, deleteCompany, getCompanyData, setSession } from "@/lib/store";
import { logAudit } from "@/lib/auditLog";
import { Building2, Plus, Trash2, ShieldCheck, ShieldAlert, LogOut, LogIn } from "lucide-react";
import Logo from "@/components/Logo";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import NewsBroadcast from "@/components/owner/NewsBroadcast";
import SubscribersDashboard from "@/components/owner/SubscribersDashboard";
import SaasAnalyticsDashboard from "@/components/owner/SaasAnalyticsDashboard";
import PlatformRoadmap from "@/components/owner/PlatformRoadmap";
import ProductFeedbackDashboard from "@/components/owner/ProductFeedbackDashboard";
import PlatformReportDashboard from "@/components/owner/PlatformReportDashboard";
import AuditLogDashboard from "@/components/owner/AuditLogDashboard";

export default function OwnerPanel() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter", allowedEmailDomain: "" });
  const [tab, setTab] = useState("analytics");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const refresh = () => setCompanies(listCompanies());
  useEffect(() => {
    if (user?.role === "admin") {
      refresh();
    }
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
    <div className="min-h-screen bg-landing-bg px-4 py-10 sm:px-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-heading font-semibold text-lg text-[#3a2f22] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-landing-gold" /> {t("ownerPanel")}
            </span>
          </div>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-1.5 text-sm text-[#3a2f22]/60 hover:text-[#3a2f22] font-body"
          >
            <LogOut className="w-4 h-4" /> {t("logout")}
          </button>
        </div>

        <div className="flex overflow-x-auto rounded-2xl bg-white p-1 shadow-sm no-scrollbar">
          {[
            { key: "analytics", ar: "لوحة التحليلات", en: "Analytics" },
            { key: "subscriptions", ar: "إدارة الاشتراكات", en: "Subscriptions" },
            { key: "report", ar: "تقرير المنصة", en: "Platform report" },
            { key: "companies", ar: "الشركات", en: "Companies" },
            { key: "feedback", ar: "التقييمات", en: "Feedback" },
            { key: "audit", ar: "سجل التدقيق", en: "Audit log" },
            { key: "roadmap", ar: "خارطة التطوير", en: "Roadmap" },
          ].map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`min-w-max flex-1 px-4 py-2.5 rounded-xl text-sm font-body font-semibold transition-colors ${
                tab === tb.key ? "bg-gradient-to-b from-landing-gold-light to-landing-gold text-white" : "text-[#3a2f22]/60 hover:text-[#3a2f22]"
              }`}
            >
              {lang === "ar" ? tb.ar : tb.en}
            </button>
          ))}
        </div>

        {tab === "analytics" && <SaasAnalyticsDashboard lang={lang} />}
        {tab === "subscriptions" && <SubscribersDashboard ar={lang === "ar"} />}
        {tab === "report" && <PlatformReportDashboard ar={lang === "ar"} />}
        {tab === "roadmap" && <PlatformRoadmap ar={lang === "ar"} />}
        {tab === "feedback" && <ProductFeedbackDashboard ar={lang === "ar"} companies={companies} />}
        {tab === "audit" && <AuditLogDashboard ar={lang === "ar"} companies={companies} />}

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