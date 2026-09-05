import React from "react";
import { useI18n } from "@/lib/i18n";
import OffboardingCustodyBoard from "@/components/employees/OffboardingCustodyBoard";

/** Thin shell — custody / EOS board is server-derived via `offboarding`. */
export default function OffboardingTab({ employee, canManage }) {
  const { lang } = useI18n();
  return (
    <OffboardingCustodyBoard
      employee={employee}
      canManage={!!canManage}
      lang={lang}
    />
  );
}
