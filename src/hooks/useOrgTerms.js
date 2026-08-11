import { useMemo } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { buildOrgTerms, getOrgType, orgAwareT, ORG_TYPES } from "@/lib/orgTerms";
import { updateCompany, logAudit } from "@/lib/store";

/**
 * Live org terminology for the signed-in company.
 * Prefer `terms.station` / `tt("stations")` over hardcoding labels.
 */
export function useOrgTerms() {
  const { data, company, currentUser } = useAuth();
  const { t, lang } = useI18n();
  const orgType = getOrgType(data);
  const terms = useMemo(() => buildOrgTerms(orgType, lang), [orgType, lang]);

  const tt = useMemo(() => (key, ...args) => orgAwareT(t, terms, key, ...args), [t, terms]);

  /**
   * Prefer reading terms. Prefer not mutating orgType after signup —
   * company vs government use separate login portals and accounts.
   * setOrgType remains for rare migrations / owner repair only.
   */
  const setOrgType = (next) => {
    if (!company?.id) return;
    const value = next === ORG_TYPES.GOV ? ORG_TYPES.GOV : ORG_TYPES.COMPANY;
    if (getOrgType(data) === value) return;
    updateCompany(company.id, (d) => {
      d.settings = { ...(d.settings || {}), orgType: value };
    });
    const actor = currentUser?.name || "system";
    logAudit(company.id, "org_type_changed", `orgType → ${value} (${actor})`);
  };

  return { orgType, terms, tt, setOrgType, isGov: terms.isGov };
}
