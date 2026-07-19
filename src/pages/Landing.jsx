import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import { trackVisit } from "@/lib/trackVisit";

export default function Landing() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  useEffect(() => {
    trackVisit("/");
  }, []);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-landing-bg px-4 py-10 sm:px-6"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <Logo size={68} className="mx-auto" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            {ar ? "مرحباً بعودتك" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ar ? "سجّل الدخول إلى PowerCare" : "Log in to PowerCare"}
          </p>
        </div>

        <section className="rounded-3xl border border-landing-gold/20 bg-card p-6 shadow-elevated sm:p-8">
          <PowerCareLoginPanel />
        </section>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {ar ? "ليس لديك حساب؟ " : "Don't have an account? "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {ar ? "إنشاء حساب" : "Create one"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 bg-landing-bg py-2">
      <span className="h-px w-24 bg-gradient-to-r from-transparent to-landing-gold/50" />
      <span className="h-1.5 w-1.5 rotate-45 bg-landing-gold" />
      <span className="h-px w-24 bg-gradient-to-l from-transparent to-landing-gold/50" />
    </div>
  );
}

function FeatureBullet({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="w-9 h-9 rounded-full border border-landing-gold/40 flex items-center justify-center shrink-0 text-landing-gold">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <p className="text-[#3a2f22]/80 font-body text-sm leading-relaxed">{title}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="bg-landing-olive-card rounded-2xl p-6 shadow-sm">
      <span className="w-12 h-12 rounded-xl bg-landing-bg flex items-center justify-center mb-4 text-landing-gold">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </span>
      <h3 className="font-heading text-xl text-[#3a2f22] mb-2">{title}</h3>
      <p className="text-sm text-[#3a2f22]/55 font-body leading-relaxed">{text}</p>
    </div>
  );
}