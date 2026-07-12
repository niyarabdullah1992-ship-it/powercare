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
    <div className="min-h-screen bg-landing-bg font-body text-[#3a2f22]" dir={dir}>
      <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-landing-gold/15">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-heading font-semibold text-lg">PowerCare</span>
        </div>
        <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-landing-gold/25 bg-white text-sm hover:bg-white/70 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} strokeWidth={1.75} /> {c.back}
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 md:py-20">
        <h1 className="hero-title text-landing-gold text-5xl md:text-7xl mb-6">{c.title}</h1>
        <p className="text-base md:text-lg text-[#3a2f22]/70 leading-relaxed max-w-3xl">{c.intro}</p>

        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="font-heading text-2xl mb-3">{c.missionTitle}</h2>
          <p className="text-sm md:text-base text-[#3a2f22]/60 leading-relaxed">{c.mission}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {c.features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="w-11 h-11 rounded-xl bg-landing-bg flex items-center justify-center mb-4 text-landing-gold">
                <f.icon className="w-5 h-5" strokeWidth={1.5} />
              </span>
              <h3 className="font-heading text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-[#3a2f22]/55 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-b from-landing-gold-light to-landing-gold rounded-2xl p-8 text-white">
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