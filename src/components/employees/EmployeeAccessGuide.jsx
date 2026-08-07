import React from "react";
import { KeyRound } from "lucide-react";

export default function EmployeeAccessGuide({ t }) {
  return (
    <div className="md:col-span-3 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
      <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div>
        <h3 className="text-sm font-semibold font-body">{t("employeeAccessGuideTitle")}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-body">
          {t("employeeAccessGuideText")}
        </p>
      </div>
    </div>
  );
}