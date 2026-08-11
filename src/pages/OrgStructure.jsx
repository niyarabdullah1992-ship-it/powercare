import React from "react";
import { Network } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import PageHeader from "@/components/PageHeader";
import OrgStructureBoard from "@/components/hr/OrgStructureBoard";
import FlexOrgTree from "@/components/hr/FlexOrgTree";

/** One-job surface: org chart + permission derivation (Platform `org`). */
export default function OrgStructure() {
  const { lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const { terms } = useOrgTerms();
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === "ar" ? "الهيكل التنظيمي" : "Org Structure"}
        description={
          lang === "ar"
            ? `منه تُشتق الصلاحيات وسلسلة التصعيد · ${terms.stations}`
            : `Permissions and escalation derive from it · ${terms.stations}`
        }
        icon={Network}
      />
      <OrgStructureBoard lang={lang} />
      <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} />
    </div>
  );
}
