import React from "react";
import { useI18n } from "@/lib/i18n";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import HelpSection from "@/components/help/HelpSection";
import { PLATFORM_HELP_SECTIONS } from "@/lib/helpSections";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { ui } from "@/lib/platformStyles";

export default function Help() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const sections = PLATFORM_HELP_SECTIONS.map(({ icon, ar: arabic, en: english }) => {
    const [title, ...steps] = ar ? arabic : english;
    return { icon, title, steps };
  });

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "دليل الاستخدام" : "User guide"}
      hint={ar
        ? "أحدث دليل لأقسام المنصة، من تسجيل الدخول حتى الأمن والخصوصية."
        : "The current guide to every platform section, from sign-in through security and privacy."}
      meta={(
        <Link to="/app/manual" style={{ ...ui.btnSecondary, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <BookOpen style={{ width: 14, height: 14 }} />
          {ar ? "الدليل التشغيلي PDF" : "Operations manual PDF"}
        </Link>
      )}
    >
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {sections.map((s) => (
          <HelpSection key={s.title} icon={s.icon} title={s.title} steps={s.steps} dir={ar ? "rtl" : "ltr"} />
        ))}
      </div>
    </PlatformStampShell>
  );
}
