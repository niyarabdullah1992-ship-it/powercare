import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageHRLevels } from "@/lib/permissions";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import ComplaintEscalationEditor from "@/components/hr/ComplaintEscalationEditor";

export default function HRStructureManagement() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  if (!data || !currentUser) return null;
  const canManage = canManageHRLevels(currentUser, data);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hrPageNote")}</p>
      </div>
      <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} />
      <ComplaintEscalationEditor data={data} companyId={company.id} canManage={canManage} lang={lang} />
    </div>
  );
}