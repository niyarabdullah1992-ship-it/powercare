import React from "react";
import { Check, ClipboardCheck, Languages, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

const Feature = ({ icon: Icon, title, text, children }) => <div className="promo-feature"><Icon className="h-16 w-16 text-landing-gold-light md:h-24 md:w-24" /><h3 className="font-heading text-3xl text-landing-bg md:text-6xl">{title}</h3><p className="font-body text-sm text-landing-bg/60 md:text-xl">{text}</p>{children}</div>;

export default function PromoScene({ scene, progress, lang }) {
  if (scene === "logo") return <div className="promo-center"><div className="promo-logo-glow"><Logo size={96} /></div><p className="promo-kicker">POWERCARE</p></div>;
  if (scene === "title") return <div className="promo-center promo-title-rise"><p className="promo-kicker">قوة الإدارة في مكان واحد</p><h3 className="font-heading text-4xl leading-tight text-landing-bg md:text-7xl">منصة إدارة متكاملة</h3></div>;
  if (scene === "attendance") return <Feature icon={MapPin} title="حضور ذكي ودقيق" text="تحقق من الموقع ومتابعة لحظية"><span className="promo-location-pulse" /></Feature>;
  if (scene === "tasks") return <Feature icon={ClipboardCheck} title="مهام تتحرك مع فريقك" text="من التكليف إلى الإنجاز بوضوح"><div className="promo-checks">{[0.2, 0.5, 0.8].map((point) => <span key={point} className={progress >= point ? "is-filled" : ""}><Check /> متابعة مكتملة</span>)}</div></Feature>;
  if (scene === "payroll") return <Feature icon={Sparkles} title="الرواتب والموارد البشرية" text="أرقام موحدة، قرارات أسرع"><strong className="promo-counter">{Math.round(1245000 * progress).toLocaleString(lang)} <small>ر.س</small></strong></Feature>;
  if (scene === "hse") return <Feature icon={ShieldCheck} title="سلامة مهنية بلا تنازلات" text="HSE — الوقاية قبل المخاطر"><span className="promo-shield-flame" /></Feature>;
  if (scene === "stats") return <div className="promo-stats">{[["120+", "شركة"], ["9", "لغات"], ["30+", "ميزة"]].map(([value, label], index) => <div key={label} style={{ animationDelay: `${index * 180}ms` }}><strong>{value}</strong><span>{label}</span></div>)}</div>;
  return <div className="promo-center"><div className="promo-logo-glow"><Logo size={82} /></div><h3 className="font-heading text-4xl text-landing-bg md:text-7xl">ابدأ اليوم</h3><p className="promo-kicker"><Languages className="inline h-4 w-4" /> مستقبل العمل يبدأ هنا</p><span className="promo-gold-flash" /></div>;
}