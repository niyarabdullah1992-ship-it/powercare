import React from "react";
import { Network } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PageHeader from "@/components/PageHeader";
import ManagementChainLadder from "@/components/hr/ManagementChainLadder";

export default function MyChain() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  const levels = lang === "ar" ? [
    "مديرك المباشر: الحضور، الإجازات القصيرة، ومراجعة إنجاز المهام.",
    "المستوى الأعلى: الإجازات الطويلة، الاعتراضات، والتصعيدات التلقائية.",
    "رأس الهرم: يرى المؤشرات فقط — لا تصل إليه إلا التصعيدات القصوى.",
  ] : [
    "Your direct manager: attendance, short leave, and task completion review.",
    "The level above: long leave, objections, and automatic escalations.",
    "Top of the pyramid: sees indicators only — only extreme escalations reach it.",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === "ar" ? "التسلسل الإداري" : "Management chain"}
        description={lang === "ar"
          ? "هذا التسلسل هو نفسه مسار الاعتماد والتصعيد: طلباتك تصعد فيه خطوة خطوة، واعتراضك على أي رفض ينتقل تلقائيًا للمستوى الأعلى."
          : "This chain is your approval and escalation path: requests move up step by step, and any objection is raised automatically to the level above."}
        icon={Network}
      />

      <ManagementChainLadder data={data} employeeId={currentUser.id} lang={lang} />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-semibold">{lang === "ar" ? "ماذا يعتمد كل مستوى؟" : "What does each level approve?"}</h2>
        <ul className="mt-3 space-y-2.5">
          {levels.map((line) => (
            <li key={line} className="flex gap-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}