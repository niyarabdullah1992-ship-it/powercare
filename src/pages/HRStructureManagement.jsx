import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import JobGradeManager from "@/components/employees/JobGradeManager";
import OrgTypeSettings from "@/components/hr/OrgTypeSettings";
import OrgStructureBoard from "@/components/hr/OrgStructureBoard";
import CompanySettingsBoard from "@/components/hr/CompanySettingsBoard";

export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const { terms } = useOrgTerms();
  const [gradesOpen, setGradesOpen] = useState(false);
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ar"
            ? `إدارة الهيكل والمستويات — المصطلحات الحالية: ${terms.stations} · رأس الهيكل: ${terms.ceo}`
            : `Manage structure and levels — current terms: ${terms.stations} · hierarchy head: ${terms.ceo}`}
        </p>
      </div>
      <OrgTypeSettings lang={lang} />
      <OrgStructureBoard lang={lang} />
      <CompanySettingsBoard lang={lang} />
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