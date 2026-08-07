import React from "react";
import { FileText, Paperclip } from "lucide-react";
import OverviewCard from "./OverviewCard";

// المستندات المرفقة — العقد، شهادة الراتب، والشهادات المعتمدة.
export default function DocumentsCard({ employee, ar }) {
  const profile = employee.profile || {};
  const docs = [
    profile.contract?.fileUrl && { name: ar ? "عقد العمل الموقّع" : "Signed contract", url: profile.contract.fileUrl, note: profile.contract.endDate },
    profile.salaryCertificateUrl && { name: profile.salaryCertificateName || (ar ? "شهادة راتب" : "Salary certificate"), url: profile.salaryCertificateUrl },
    ...(employee.certificates || []).map((certificate) => ({ name: certificate.name, url: certificate.url, note: certificate.category })),
  ].filter(Boolean);

  return (
    <OverviewCard title={ar ? "المستندات المرفقة" : "Attached documents"} icon={Paperclip}>
      {docs.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد مستندات مرفقة" : "No attached documents"}</p>
      ) : (
        docs.map((doc, index) => (
          <a key={index} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0 hover:text-accent">
            <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-[9px] font-semibold text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{doc.name}</span>
            {doc.note && <span className="shrink-0 text-[11px] text-muted-foreground">{doc.note}</span>}
          </a>
        ))
      )}
    </OverviewCard>
  );
}