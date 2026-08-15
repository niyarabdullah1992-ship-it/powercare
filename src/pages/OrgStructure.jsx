import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import OrgStructureBoard from "@/components/hr/OrgStructureBoard";
import HcmFoundationBoard from "@/components/hr/HcmFoundationBoard";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import { MUTED, NAVY, cardShell } from "@/lib/platformStyles";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/** Platform `org` — flexible people tree is primary; branch admin is secondary. */
export default function OrgStructure() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const { terms } = useOrgTerms();
  if (!data || !currentUser) return null;

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "الهيكل التنظيمي" : "Org structure"}
      hint={ar
        ? `اسم الفرع وحدة التشغيل، والأشخاص يُسحَبون بين الفروع بحرية · ${terms.stations}`
        : `Branch name is the operating unit; people move freely between branches · ${terms.stations}`}
      maxWidth={1280}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} />

        <details style={{ ...cardShell, padding: "14px 20px" }}>
          <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: NAVY, listStyle: "none" }}>
            {ar ? "إدارة الفروع والمسؤولين" : "Branch & manager admin"}
          </summary>
          <p style={{ margin: "8px 0 14px", fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>
            {ar
              ? "أنشئ فرعًا باسمه أو غيّر المسؤول — بدون منطقة شرق/غرب مفروضة."
              : "Create a branch by name or change its manager — no forced East/West region."}
          </p>
          <OrgStructureBoard lang={lang} />
        </details>

        <details style={{ ...cardShell, padding: "14px 20px" }}>
          <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: NAVY, listStyle: "none" }}>
            {ar ? "سجل HCM والوحدات — ثانوي" : "HCM register & units — secondary"}
          </summary>
          <div style={{ marginTop: "14px" }}>
            <HcmFoundationBoard lang={lang} />
          </div>
        </details>
      </div>
    </PlatformStampShell>
  );
}
