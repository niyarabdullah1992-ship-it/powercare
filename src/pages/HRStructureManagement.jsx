import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import JobGradeManager from "@/components/employees/JobGradeManager";

export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [gradesOpen, setGradesOpen] = useState(false);
  if (!data || !currentUser) return null;
  const TreeArrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("hrPageNote")}</p></div>
        <Link to="/app/hr-tree" className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">{lang === "ar" ? "شجرة الموارد البشرية" : "Human Resources tree"}<TreeArrow className="h-4 w-4" /></Link>
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