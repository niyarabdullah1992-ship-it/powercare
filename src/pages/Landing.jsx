import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { ownerLogin, ownerExists, setOwner, listCompanies, createCompany, deleteCompany } from "@/lib/store";
import { Zap, Building2, Plus, Trash2, ShieldCheck, LogIn, Globe, ChevronDown, Check } from "lucide-react";

export default function Landing() {
  const { t, lang, setLang, languages } = useI18n();
  const { login, session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("company");
  const [email, setEmail] = useState("admin@gulfpower.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang);

  useEffect(() => {
    if (session) navigate("/app");
  }, [session, navigate]);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  const handleCompanyLogin = (e) => {
    e.preventDefault();
    setError("");
    const c = login(email, password);
    if (!c) setError("Invalid credentials");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
            <Zap className="w-5 h-5 text-background" strokeWidth={2} />
          </div>
          <span className="font-heading font-semibold text-xl">{t("appName")}</span>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm font-body hover:bg-muted transition-colors"
          >
            <Globe className="w-4 h-4" strokeWidth={1.75} />
            <span>{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
          </button>
          {langOpen && (
            <div className="absolute end-0 mt-2 w-48 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-body transition-colors ${
                    lang === l.code ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <span>{l.flag} {l.code.toUpperCase()}</span>
                  {lang === l.code && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-3">{t("appName")}</h1>
            <p className="text-muted-foreground font-body">{t("tagline")}</p>
            <p className="mt-3 text-xs text-muted-foreground/70 font-body">{t("demoNote")}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setTab("company")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-body border-b-2 transition-colors ${
                tab === "company" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" strokeWidth={1.75} /> {t("companyLogin")}
            </button>
            <button
              onClick={() => setTab("owner")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-body border-b-2 transition-colors ${
                tab === "owner" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> {t("ownerPanel")}
            </button>
          </div>

          {tab === "company" ? (
            <form onSubmit={handleCompanyLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1.5">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1.5">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-md bg-foreground text-background font-body text-sm font-medium hover:bg-accent transition-colors"
              >
                {t("login")}
              </button>
              <p className="text-center text-xs text-muted-foreground font-body pt-2">
                Demo: <code className="text-foreground">admin@gulfpower.com</code> / <code className="text-foreground">demo123</code>
              </p>
            </form>
          ) : (
            <OwnerSection t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerSection({ t }) {
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter" });

  const refresh = () => setCompanies(listCompanies());
  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  const handleOwnerLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!ownerExists()) {
      setOwner(pwd || "owner123");
      setAuthed(true);
      return;
    }
    if (ownerLogin(pwd)) setAuthed(true);
    else setError("Wrong owner password");
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.ownerEmail || !form.ownerPassword) return;
    createCompany(form);
    setForm({ name: "", ownerEmail: "", ownerPassword: "", plan: "Starter" });
    refresh();
  };

  const handleDelete = (id) => {
    if (confirm(t("confirmDelete"))) {
      deleteCompany(id);
      refresh();
    }
  };

  if (!authed) {
    return (
      <form onSubmit={handleOwnerLogin} className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-xs font-body text-muted-foreground">
          <ShieldCheck className="w-4 h-4" /> Platform owner access only.
        </div>
        <div>
          <label className="block text-xs font-body text-muted-foreground mb-1.5">{t("password")}</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="owner123"
            className="w-full px-3 py-2.5 rounded-md border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-sm text-destructive font-body">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-md bg-foreground text-background font-body text-sm font-medium hover:bg-accent transition-colors">
          {t("login")}
        </button>
        <p className="text-center text-xs text-muted-foreground font-body">Demo owner password: <code className="text-foreground">owner123</code></p>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> {t("companies")} ({companies.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {companies.length === 0 && <p className="text-sm text-muted-foreground font-body">No companies yet.</p>}
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.ownerEmail} · {c.plan}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-destructive hover:bg-muted rounded-md shrink-0">
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-border">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t("createCompany")}
        </h3>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("companyName")} required
          className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
        <input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder={t("email")} required
          className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
        <input value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} placeholder={t("password")} required
          className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
          className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring">
          <option>Starter</option>
          <option>Professional</option>
          <option>Enterprise</option>
        </select>
        <button type="submit" className="w-full py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-accent transition-colors">
          {t("createCompany")}
        </button>
      </form>
    </div>
  );
}