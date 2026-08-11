import React, { useState } from "react";
import { ChevronDown, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import JobGradeManager from "@/components/employees/JobGradeManager";
import PageHeader from "@/components/PageHeader";

/** One-job surface: people directory & grades (Platform `hr`). Org/settings live on their own routes. */
export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const { terms } = useOrgTerms();
  const [gradesOpen, setGradesOpen] = useState(false);
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === "ar" ? "الموارد البشرية" : "Human Resources"}
        description={
          lang === "ar"
            ? `دليل الموظفين والتعيين · ${terms.stations} · رأس الهيكل: ${terms.ceo}`
            : `Employee directory and onboarding · ${terms.stations} · hierarchy head: ${terms.ceo}`
        }
        icon={UserCog}
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/app/org" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:border-accent/40">
          {lang === "ar" ? "الهيكل التنظيمي" : "Org structure"}
        </Link>
        <Link to="/app/hiring" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:border-accent/40">
          {lang === "ar" ? "التوظيف" : "Recruitment"}
        </Link>
        <Link to="/app/settings" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:border-accent/40">
          {lang === "ar" ? "إعدادات الشركة" : "Company settings"}
        </Link>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setGradesOpen((open) => !open)}
          aria-expanded={gradesOpen}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-start font-heading text-lg font-semibold"
        >
          {t("jobGradesManage")}
          <ChevronDown className={`h-5 w-5 transition-transform ${gradesOpen ? "rotate-180" : ""}`} />
        </button>
        {gradesOpen && <JobGradeManager companyId={company.id} data={data} />}
      </div>
      <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} />
    </div>
  );
}
