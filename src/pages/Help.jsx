import React from "react";
import { useI18n } from "@/lib/i18n";
import { HelpCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import HelpSection from "@/components/help/HelpSection";
import { PLATFORM_HELP_SECTIONS } from "@/lib/helpSections";

export default function Help() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const sections = PLATFORM_HELP_SECTIONS.map(({ icon, ar: arabic, en: english }) => {
    const [title, ...steps] = ar ? arabic : english;
    return { icon, title, steps };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2">
          <HelpCircle className="w-6 h-6" /> {ar ? "دليل الاستخدام" : "User Guide"}
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {ar
            ? "أحدث دليل لجميع أقسام المنصة، مرتب حسب أقسام النظام من تسجيل الدخول حتى الأمن والخصوصية."
            : "The latest guide to every platform section, ordered from sign-in through security and privacy."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <HelpSection key={s.title} icon={s.icon} title={s.title} steps={s.steps} />
        ))}
      </div>
    </div>
  );
}