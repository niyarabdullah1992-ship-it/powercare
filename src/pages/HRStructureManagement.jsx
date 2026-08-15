import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import JobGradeManager from "@/components/employees/JobGradeManager";
import HrDirectoryBoard from "@/components/hr/HrDirectoryBoard";
import ComplianceMhrsdBoard from "@/components/hr/ComplianceMhrsdBoard";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/**
 * Platform `hr` — directory table, onboarding pipeline, grades, and the single
 * canonical home of the MHRSD compliance centre (Settings links here).
 */
export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [gradesOpen, setGradesOpen] = useState(false);
  const stationScope = useStationScope();
  if (!data || !currentUser) return null;

  return (
    <PlatformStampShell
      ar={lang === "ar"}
      title={lang === "ar" ? "الموارد البشرية" : "Human resources"}
      hint={lang === "ar" ? "الدليل الوظيفي، الدرجات، ومركز امتثال وزارة الموارد البشرية." : "Directory, grades, and the MHRSD compliance centre."}
      maxWidth={1280}
    >
      <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link to="/app/org" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "الهيكل التنظيمي" : "Org structure"}
        </Link>
        <Link to="/app/hiring" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "التوظيف" : "Recruitment"}
        </Link>
        <Link to="/app/settings" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "إعدادات الشركة" : "Company settings"}
        </Link>
      </div>

      <HrDirectoryBoard lang={lang} stationScope={stationScope} />

      <div className="nv-card overflow-hidden">
        <button
          type="button"
          onClick={() => setGradesOpen((open) => !open)}
          aria-expanded={gradesOpen}
          className="flex w-full items-center justify-between px-[18px] py-3.5 text-start text-[13px] font-semibold text-[#14284B]"
        >
          {t("jobGradesManage")}
          <ChevronDown className={`h-4 w-4 text-[#5A6B85] transition-transform ${gradesOpen ? "rotate-180" : ""}`} />
        </button>
        {gradesOpen && (
          <div className="border-t border-[#E2E8F0] px-[18px] py-4">
            <JobGradeManager companyId={company.id} data={data} />
          </div>
        )}
      </div>

      <ComplianceMhrsdBoard />
      </div>
    </PlatformStampShell>
  );
}
