import React, { useState } from "react";
import { Mails } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleEmployees } from "@/lib/permissions";
import { createCorrespondence, referCorrespondence, closeCorrespondence, slaState } from "@/lib/correspondence";
import CorrespondenceForm from "@/components/correspondence/CorrespondenceForm";
import CorrespondenceCard from "@/components/correspondence/CorrespondenceCard";

export default function Correspondence() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const [filter, setFilter] = useState("all");

  if (!data || !currentUser) return null;

  const records = data.correspondence || [];
  const employees = visibleEmployees(currentUser, data);

  const filters = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "incoming", label: ar ? "وارد" : "Incoming" },
    { id: "outgoing", label: ar ? "صادر" : "Outgoing" },
    { id: "internal", label: ar ? "داخلي" : "Internal" },
    { id: "breached", label: ar ? "متجاوزة المهلة" : "SLA breached" },
    { id: "closed", label: ar ? "مغلقة" : "Closed" },
  ];

  const visible = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "breached") return slaState(record) === "breached";
    if (filter === "closed") return record.status === "closed";
    return record.direction === filter;
  });

  const breachedCount = records.filter((record) => slaState(record) === "breached").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2"><Mails className="h-7 w-7 text-accent" />{ar ? "المعاملات والمراسلات" : "Correspondence"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? `وارد وصادر برقم نظامي ومهلة وسلسلة إحالات — ${breachedCount} معاملة تجاوزت مهلتها.` : `Incoming and outgoing with statutory numbers, deadlines and referral chains — ${breachedCount} past due.`}
        </p>
      </div>

      <CorrespondenceForm lang={lang} employees={employees} onCreate={(form) => createCorrespondence(company.id, form, currentUser)} />

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {filters.map((item) => (
          <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-md px-3 py-2 text-sm font-medium ${filter === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{ar ? "لا توجد معاملات في هذا التصنيف." : "No correspondence in this filter."}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((record) => (
            <CorrespondenceCard
              key={record.id}
              record={record}
              employees={employees}
              lang={lang}
              onRefer={(id, payload) => referCorrespondence(company.id, id, payload, currentUser)}
              onClose={(id, decision) => closeCorrespondence(company.id, id, decision, currentUser)}
            />
          ))}
        </div>
      )}
    </div>
  );
}