import React from "react";
import { Briefcase } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { useOrgTerms } from "@/hooks/useOrgTerms";

/** Company account type — display only. */
export default function OrgTypeSettings({ lang = "ar" }) {
  const ar = lang === "ar";
  const { terms } = useOrgTerms();

  return (
    <IdentityCard
      icon={Briefcase}
      kicker={ar ? "نوع الجهة" : "ORGANIZATION TYPE"}
      title={ar ? "شركة / مؤسسة" : "Company / enterprise"}
      subtitle={
        ar
          ? `هذه المنشأة مسجّلة كـ «${terms.orgKind}».`
          : `This facility is registered as «${terms.orgKind}».`
      }
      dir={ar ? "rtl" : "ltr"}
    />
  );
}
