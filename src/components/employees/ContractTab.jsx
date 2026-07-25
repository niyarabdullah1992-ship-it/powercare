import React, { useState } from "react";
import { FileUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ContractForm from "@/components/employees/ContractForm";
import ContractCard from "@/components/employees/ContractCard";

export default function ContractTab({ employee, companyId, canEdit }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const contract = employee.profile?.contract;
  const [editing, setEditing] = useState(false);
  if (editing) return <ContractForm employee={employee} companyId={companyId} contract={contract} ar={ar} onDone={() => setEditing(false)} />;
  if (contract?.fileUrl) return <ContractCard contract={contract} canEdit={canEdit} ar={ar} onUpdate={() => setEditing(true)} />;
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
    <span className="mb-4 rounded-xl bg-accent/15 p-3"><FileUp className="h-7 w-7 text-accent" /></span>
    <h3 className="font-heading text-lg font-semibold">{ar ? "لا يوجد عقد مرفوع بعد" : "No contract uploaded yet"}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{ar ? "سيظهر ملف العقد وتواريخه هنا بعد رفعه." : "The contract file and its dates will appear here after upload."}</p>
    {canEdit && <button type="button" onClick={() => setEditing(true)} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{ar ? "رفع عقد" : "Upload contract"}</button>}
  </div>;
}