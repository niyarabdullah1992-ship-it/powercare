import React, { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import HROrgTree from "@/components/hr/HROrgTree";
import JobGradeManager from "@/components/employees/JobGradeManager";

export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [gradesOpen, setGradesOpen] = useState(false);
  const [treeView, setTreeView] = useState("general");
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hrPageNote")}</p>
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
      {treeView === "general" ? (
        <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} onOpenHR={() => setTreeView("hr")} />
      ) : (
        <div className="space-y-3">
          <button type="button" onClick={() => setTreeView("general")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {lang === "ar" ? "العودة إلى الشجرة العامة" : "Back to organization tree"}
          </button>
          <HROrgTree data={data} company={company} currentUser={currentUser} lang={lang} />
        </div>
      )}
    </div>
  );
}