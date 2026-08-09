import React from "react";
import { ScrollText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LEAVE_TYPES } from "@/lib/leaveTypes";

// Company-wide statutory leave policy — defined once, never repeated per employee.
export default function LeavePolicyCard({ ar }) {
  const { t } = useI18n();
  const fixed = LEAVE_TYPES.filter((ty) => ty.key !== "annual" && ty.defaultTotal !== null);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-semibold">
        <ScrollText className="h-4 w-4 text-accent" />{ar ? "سياسة الإجازات للمنشأة" : "Company leave policy"}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {fixed.map((ty) => (
          <span key={ty.key} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-body">
            {t(ty.key)} <span className="text-muted-foreground">{ty.defaultTotal} {t("days")}</span>
          </span>
        ))}
      </div>
    </section>
  );
}