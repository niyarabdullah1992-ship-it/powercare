import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { ownerLogin, ownerExists, setOwner, listCompanies, createCompany, deleteCompany } from "@/lib/store";
import { Building2, Plus, Trash2, ShieldCheck, LogIn, Globe, ChevronDown, Check, Clock, TrendingUp, Facebook, Twitter, X as XIcon, Send, MapPin, Lock, Factory, Phone, Mail } from "lucide-react";
import Logo from "@/components/Logo";

const HERO_IMG = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/e7b0832c6_generated_image.png";

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
    <div className="min-h-screen bg-landing-bg font-body text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg text-white">{t("appName")}</span>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-sm font-body text-white/90 hover:bg-white/10 transition-colors"
          >
            <Globe className="w-4 h-4" strokeWidth={1.75} />
            <span>{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
          </button>
          {langOpen && (
            <div className="absolute end-0 mt-2 w-48 rounded-md border border-white/10 bg-landing-bg shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-body transition-colors ${
                    lang === l.code ? "bg-landing-gold text-landing-bg" : "text-white/80 hover:bg-white/10"
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

      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-landing-bg via-landing-bg/85 to-landing-bg/40" />
        <div className="relative px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-[1.3fr,1fr] gap-12 items-start">
          <div>
            <h1 className="hero-title text-landing-gold text-6xl md:text-8xl uppercase">{t("appName")}</h1>
            <p className="text-2xl md:text-3xl font-heading text-white/90 mt-3 max-w-md leading-snug">{t("tagline")}</p>
            <p className="mt-3 text-sm text-white/45 font-body">{t("demoNote")}</p>

            <div className="mt-10 space-y-6">
              <FeatureBullet icon={Clock} title="Maximize Uptime with Intelligent Scheduling" />
              <FeatureBullet icon={TrendingUp} title="Advanced Data Analytics for Optimal Performance" />
              <FeatureBullet icon={ShieldCheck} title="Secure, Scalable Solutions for Infrastructure" />
            </div>
          </div>

          {/* Login card */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="flex border-b border-white/10 mb-6">
              <button
                onClick={() => setTab("company")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-body border-b-2 transition-colors ${
                  tab === "company" ? "border-landing-gold text-white" : "border-transparent text-white/40"
                }`}
              >
                <LogIn className="w-4 h-4" strokeWidth={1.75} /> {t("companyLogin")}
              </button>
              <button
                onClick={() => setTab("owner")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-body border-b-2 transition-colors ${
                  tab === "owner" ? "border-landing-gold text-white" : "border-transparent text-white/40"
                }`}
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> {t("ownerPanel")}
              </button>
            </div>

            {tab === "company" ? (
              <form onSubmit={handleCompanyLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-body text-white/50 mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-md border border-white/15 bg-white/5 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 mb-1.5">{t("password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-md border border-white/15 bg-white/5 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold"
                  />
                </div>
                {error && <p className="text-sm text-red-400 font-body">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-landing-gold text-landing-bg font-body text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {t("login")}
                </button>
                <p className="text-center text-xs text-white/40 font-body pt-2">
                  Demo: <code className="text-white/70">admin@gulfpower.com</code> / <code className="text-white/70">demo123</code>
                </p>
              </form>
            ) : (
              <OwnerSection t={t} />
            )}
          </div>
        </div>
      </div>

      {/* Ribbon */}
      <div className="border-t border-white/10 bg-landing-bg px-6 md:px-10 py-4 text-center text-sm font-body">
        <span className="text-landing-gold font-semibold">Announcing... Platform Benefits:</span>{" "}
        <span className="text-white/40">Explores the power station models and innovative infrastructure and corporate clients.</span>
      </div>

      {/* Benefits section */}
      <div className="bg-landing-olive px-6 md:px-10 py-16">
        <h2 className="text-center hero-title text-white text-5xl md:text-6xl mb-12">{t("appName")}</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <BenefitCard
            icon={MapPin}
            title="multi-station support"
            text="Detailed text on multi-station operations. The scalable clean multi-station operations dashboard and reporting systems and convenient monitoring covering station-house operations storage flow and analysis in the architectural retrofit."
          />
          <BenefitCard
            icon={Lock}
            title="localized data handling"
            text="Explanation of the localized data demo feature, making it a clear selling point for security-conscious firms. PowerCare stores all localized data storage to small workspaces to your data demos."
          />
          <BenefitCard
            icon={Factory}
            title="operational intelligence"
            text="Detailing the intelligence engine for its power plant and digital mirror/digital twin. Detailing the intelligence engine details any comprehensive operational intelligence — digital data answer options advanced evaluates in a platform instance, and innovates operability and advanced technology."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-landing-olive border-t border-white/10 px-6 md:px-10 py-10">
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <div>
            <h3 className="font-heading text-2xl text-white mb-3">{t("appName")}</h3>
            <p className="text-sm text-white/50 font-body leading-relaxed">
              PowerCare is a premium corporate management platform, luxurious, persuasive solution and provider for corporate clients.
            </p>
            <div className="flex items-center gap-4 mt-5 text-white/60">
              <Facebook className="w-4 h-4" strokeWidth={1.75} />
              <Twitter className="w-4 h-4" strokeWidth={1.75} />
              <XIcon className="w-4 h-4" strokeWidth={1.75} />
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white mb-3">Benefits</h4>
            <ul className="space-y-2 text-sm font-body text-white/50">
              <li>Blog</li>
              <li>About</li>
              <li>Careers</li>
              <li>Terms of Service</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white mb-3">Contact us</h4>
            <ul className="space-y-2.5 text-sm font-body text-white/50">
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-landing-gold" /> {t("appName")}</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-landing-gold" /> +123 455 7890</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-landing-gold" /> +123 9053 4700</li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-landing-gold" /> admin@gulfpower.com</li>
              <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-landing-gold" /> www.gulfpower.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBullet({ icon: Icon, title }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-full border border-landing-gold/60 flex items-center justify-center shrink-0 text-landing-gold">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <p className="text-white/85 font-body text-sm leading-relaxed pt-1.5">{title}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="bg-landing-olive-card border border-white/10 rounded-lg p-6">
      <span className="w-12 h-12 rounded-md border border-landing-gold/50 flex items-center justify-center mb-4 text-landing-gold">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </span>
      <h3 className="font-heading text-xl text-white mb-2">{title}</h3>
      <p className="text-sm text-white/45 font-body leading-relaxed">{text}</p>
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
        <div className="flex items-center gap-2 p-3 rounded-md bg-white/5 text-xs font-body text-white/50">
          <ShieldCheck className="w-4 h-4" /> Platform owner access only.
        </div>
        <div>
          <label className="block text-xs font-body text-white/50 mb-1.5">{t("password")}</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="owner123"
            className="w-full px-3 py-2.5 rounded-md border border-white/15 bg-white/5 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold"
          />
        </div>
        {error && <p className="text-sm text-red-400 font-body">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-md bg-landing-gold text-landing-bg font-body text-sm font-semibold hover:opacity-90 transition-opacity">
          {t("login")}
        </button>
        <p className="text-center text-xs text-white/40 font-body">Demo owner password: <code className="text-white/70">owner123</code></p>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2 text-white">
          <Building2 className="w-4 h-4" /> {t("companies")} ({companies.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {companies.length === 0 && <p className="text-sm text-white/40 font-body">No companies yet.</p>}
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-white/5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-white">{c.name}</p>
                <p className="text-xs text-white/40 truncate">{c.ownerEmail} · {c.plan}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:bg-white/10 rounded-md shrink-0">
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-white/10">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2 text-white">
          <Plus className="w-4 h-4" /> {t("createCompany")}
        </h3>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("companyName")} required
          className="w-full px-3 py-2 rounded-md border border-white/15 bg-white/5 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
        <input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder={t("email")} required
          className="w-full px-3 py-2 rounded-md border border-white/15 bg-white/5 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
        <input value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} placeholder={t("password")} required
          className="w-full px-3 py-2 rounded-md border border-white/15 bg-white/5 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold" />
        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
          className="w-full px-3 py-2 rounded-md border border-white/15 bg-white/5 text-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold">
          <option>Starter</option>
          <option>Professional</option>
          <option>Enterprise</option>
        </select>
        <button type="submit" className="w-full py-2.5 rounded-md bg-landing-gold text-landing-bg text-sm font-semibold hover:opacity-90 transition-opacity">
          {t("createCompany")}
        </button>
      </form>
    </div>
  );
}