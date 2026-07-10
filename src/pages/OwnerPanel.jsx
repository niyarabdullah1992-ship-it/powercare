import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { listCompanies, createCompany, deleteCompany } from "@/lib/store";
import { logAudit, fetchAllAuditLog } from "@/lib/auditLog";
import { Building2, Plus, Trash2, ShieldCheck, ShieldAlert, LogOut } from "lucide-react";
import Logo from "@/components/Logo";

export default function OwnerPanel() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter", allowedEmailDomain: "" });
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const refresh = () => setCompanies(listCompanies());
  useEffect(() => {
    if (user?.role === "admin") {
      refresh();
      fetchAllAuditLog().then(setAuditLogs);
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
    fetchAllAuditLog().then(setAuditLogs);
  };

  const handleDelete = (id) => {
    const c = companies.find((x) => x.id === id);
    if (confirm(t("confirmDelete"))) {
      deleteCompany(id);
      logAudit(id, "company_deleted", user.email, `${user.email} deleted company "${c?.name || id}".`);
      refresh();
      fetchAllAuditLog().then(setAuditLogs);
    }
  };

  return (
    <div className="min-h-screen bg-landing-bg px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
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

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2 text-[#3a2f22]">
              <Building2 className="w-4 h-4" /> {t("companies")} ({companies.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {companies.length === 0 && <p className="text-sm text-[#3a2f22]/40 font-body">No companies yet.</p>}
              {companies.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-landing-bg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-[#3a2f22]">{c.name}</p>
                    <p className="text-xs text-[#3a2f22]/40 truncate">{c.ownerEmail} · {c.plan}</p>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-white rounded-md shrink-0">
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
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

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2 text-[#3a2f22]">
            <ShieldAlert className="w-4 h-4" /> {lang === "ar" ? "سجل التدقيق (كل الشركات)" : "Audit Log (all companies)"}
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-[#3a2f22]/40 font-body">{lang === "ar" ? "لا توجد عمليات مسجلة بعد." : "No actions logged yet."}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.map((l) => (
                <div key={l.id} className="text-xs font-body p-2.5 rounded-lg bg-landing-bg">
                  <p className="text-[#3a2f22]">{l.details || l.action}</p>
                  <p className="text-[#3a2f22]/40 mt-0.5">{l.performedBy} · {new Date(l.created_date).toLocaleString(lang === "ar" ? "ar" : "en")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}