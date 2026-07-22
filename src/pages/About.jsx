import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, ShieldCheck, MapPin, Radio, Users, Mail, Phone } from "lucide-react";
import Logo from "@/components/Logo";

const CONTENT = {
  ar: {
    back: "العودة للرئيسية",
    title: "من نحن",
    intro:
      "PowerCare هي منصة إدارة مؤسسية متكاملة صُممت لمساعدة الشركات على إدارة محطاتها وفرقها اليومية بكفاءة واحترافية. نجمع بين إدارة المهام، الحضور والانصراف بتقنية GPS، التواصل الداخلي، وإدارة الموارد البشرية في مكان واحد.",
    missionTitle: "رسالتنا",
    mission:
      "تمكين الشركات من إدارة عملياتها الميدانية بشفافية ودقة، مع تجربة استخدام راقية وبسيطة تناسب جميع أفراد الفريق — من الموظف الميداني إلى مدير الشركة.",
    features: [
      { icon: Radio, title: "إدارة المحطات", text: "متابعة جميع المحطات والمواقع من لوحة تحكم واحدة مع تقارير أداء لحظية." },
      { icon: MapPin, title: "حضور ذكي بالموقع", text: "تسجيل حضور وانصراف موثّق بتقنية GPS عالية الدقة لضمان المصداقية." },
      { icon: Users, title: "موارد بشرية متكاملة", text: "هيكل إداري مرن، طلبات إجازات، شهادات، وتصعيد شكاوى منظم." },
      { icon: ShieldCheck, title: "خصوصية وأمان", text: "عزل كامل لبيانات كل شركة مع بلاغات مجهولة الهوية محمية بالتشفير." },
    ],
    contactTitle: "تواصل معنا",
  },
  en: {
    back: "Back to home",
    title: "About Us",
    intro:
      "PowerCare is an integrated corporate management platform built to help companies run their stations and daily teams with efficiency and professionalism. We combine task management, GPS-verified attendance, internal communication, and HR management in one place.",
    missionTitle: "Our Mission",
    mission:
      "Empowering companies to manage their field operations with transparency and precision, through a refined and simple experience that fits every team member — from field employee to company director.",
    features: [
      { icon: Radio, title: "Station Management", text: "Monitor all stations and sites from a single dashboard with real-time performance reports." },
      { icon: MapPin, title: "Smart GPS Attendance", text: "High-precision GPS-verified check-in and check-out for full accountability." },
      { icon: Users, title: "Complete HR Suite", text: "Flexible org hierarchy, leave requests, certificates, and structured complaint escalation." },
      { icon: ShieldCheck, title: "Privacy & Security", text: "Full data isolation per company with encrypted anonymous reporting." },
    ],
    contactTitle: "Contact us",
  },
};

export default function About() {
  const { lang, dir } = useI18n();
  const c = CONTENT[lang === "ar" ? "ar" : "en"];

  return (
    <div className="powercare-public min-h-screen bg-landing-cinema font-body text-white" dir={dir}>
      <div className="flex items-center justify-between border-b border-accent/20 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-heading font-semibold text-lg">PowerCare</span>
        </div>
        <Link to="/" className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} strokeWidth={1.75} /> {c.back}
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 md:py-20">
        <h1 className="mb-6 font-heading text-5xl font-semibold text-white md:text-7xl">{c.title}</h1>
        <p className="max-w-3xl text-base leading-relaxed text-white/60 md:text-lg">{c.intro}</p>

        <div className="mt-12 rounded-2xl border border-accent/25 bg-card p-8 text-card-foreground shadow-xl shadow-accent/10">
          <h2 className="mb-3 font-heading text-2xl">{c.missionTitle}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{c.mission}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {c.features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-accent/20 bg-card p-6 text-card-foreground shadow-sm">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent"><f.icon className="h-5 w-5" strokeWidth={1.5} /></span>
              <h3 className="mb-2 font-heading text-xl">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-accent p-8 text-accent-foreground shadow-lg shadow-accent/20">
          <h2 className="font-heading text-2xl mb-4">{c.contactTitle}</h2>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span dir="ltr">0595414472</span></li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> niyar@powercares.pro</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> turkialmutarir@gmail.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}