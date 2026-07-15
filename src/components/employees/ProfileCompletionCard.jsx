import React from "react";
import { ClipboardCheck } from "lucide-react";
import { PROFILE_GROUPS } from "@/components/employees/ProfessionalInfoTab";

// HR file completeness: percentage of the profile fields actually filled in.
// Shown to the employee as a nudge to complete their own file, and to
// managers/HR as a data-quality indicator.
export default function ProfileCompletionCard({ employee, isSelf, ar }) {
  const profile = employee.profile || {};
  const fields = PROFILE_GROUPS.flatMap((g) => g.fields).filter((f) => !f.optional);
  const filled = fields.filter((f) => String(profile[f.key] || "").trim()).length;
  const pct = Math.round((filled / fields.length) * 100);
  const done = pct === 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <ClipboardCheck className="w-4 h-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-sm">{ar ? "اكتمال الملف" : "Profile completion"}</h3>
          <p className="text-[11px] text-muted-foreground font-body">{filled}/{fields.length} {ar ? "حقلًا" : "fields"}</p>
        </div>
        <span className={`ms-auto font-heading font-semibold ${done ? "text-emerald-600" : "text-accent"}`} dir="ltr">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
      {!done && (
        <p className="text-xs text-muted-foreground font-body leading-relaxed">
          {isSelf
            ? (ar ? "أكمل بياناتك من تبويب «المعلومات المهنية» ليستفيد منها قسم الموارد البشرية." : "Complete your details from the “Professional info” tab so HR can use them.")
            : (ar ? "ملف هذا الموظف غير مكتمل — يمكنه إكماله بنفسه من حسابه." : "This employee's file is incomplete — they can complete it themselves from their account.")}
        </p>
      )}
    </div>
  );
}