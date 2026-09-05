import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, ShieldCheck, MapPin, Radio, Users, Mail, Phone } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import PublicPaperShell from "@/components/shared/PublicPaperShell";
import { MUTED, NAVY, ui } from "@/lib/platformStyles";

const CONTENT = {
  ar: {
    back: "العودة للرئيسية",
    title: "من نحن",
    intro:
      "NiroVera هي منصة إدارة مؤسسية متكاملة صُممت لمساعدة الشركات على إدارة فروعها وفرقها اليومية بكفاءة واحترافية. نجمع بين إدارة المهام، الحضور والانصراف بتقنية GPS، التواصل الداخلي، وإدارة الموارد البشرية في مكان واحد.",
    missionTitle: "رسالتنا",
    mission:
      "تمكين الشركات من إدارة عملياتها الميدانية بشفافية ودقة، مع تجربة استخدام راقية وبسيطة تناسب جميع أفراد الفريق — من الموظف الميداني إلى مدير الشركة.",
    features: [
      { icon: Radio, title: "إدارة الفروع", text: "متابعة جميع الفروع والمواقع من لوحة تحكم واحدة مع تقارير أداء لحظية." },
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
      "NiroVera is an integrated corporate management platform built to help companies run their stations and daily teams with efficiency and professionalism. We combine task management, GPS-verified attendance, internal communication, and HR management in one place.",
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
    <PublicPaperShell dir={dir} maxWidth={880}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link to="/" style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <ArrowLeft style={{ width: 14, height: 14, transform: dir === "rtl" ? "rotate(180deg)" : undefined }} />
          {c.back}
        </Link>
      </div>
      <IdentityCard title={c.title} subtitle={c.intro} dir={dir} />
      <IdentityCard title={c.missionTitle} dir={dir} bodySurface>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: MUTED }}>{c.mission}</p>
      </IdentityCard>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {c.features.map((f) => (
          <IdentityCard key={f.title} icon={f.icon} title={f.title} dir={dir} bodySurface>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: MUTED }}>{f.text}</p>
          </IdentityCard>
        ))}
      </div>
      <IdentityCard icon={Mail} title={c.contactTitle} dir={dir} bodySurface>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: NAVY }}>
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone style={{ width: 16, height: 16 }} /> <span dir="ltr">0595414472</span></li>
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail style={{ width: 16, height: 16 }} /> niyar@powercares.pro</li>
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail style={{ width: 16, height: 16 }} /> turkialmutarir@gmail.com</li>
        </ul>
      </IdentityCard>
    </PublicPaperShell>
  );
}
