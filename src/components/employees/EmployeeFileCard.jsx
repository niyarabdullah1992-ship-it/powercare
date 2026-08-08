import React, { useRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { downloadElementPdf } from "@/lib/downloadElementPdf";
import EmployeeFileDocument from "@/components/employees/EmployeeFileDocument";

const randomHex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

// Lets the employee (or HR) download their official comprehensive file as PDF.
export default function EmployeeFileCard({ employee, company, data, stationName, gradeLabel, ar }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [meta] = useState(() => ({
    docNumber: `HR-EF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`,
    fingerprint: Array.from({ length: 8 }, () => randomHex(4)).join("·"),
  }));

  const manager = data.employees.find((e) => e.id === employee.managerId);
  const hrManager = data.employees.find((e) => e.id === data.ownerId);

  const download = async () => {
    setBusy(true);
    try {
      await downloadElementPdf(ref.current, `${meta.docNumber}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-heading text-sm font-semibold">{ar ? "ملف الموظف الشامل" : "Comprehensive employee file"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{ar ? "مستند رسمي يشمل البيانات الوظيفية والشهادات والإجازات والراتب." : "Official document with employment data, certificates, leaves and salary."}</p>
      <button onClick={download} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs text-background disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {ar ? "تنزيل PDF" : "Download PDF"}
      </button>

      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
        <div ref={ref}>
          <EmployeeFileDocument
            employee={employee}
            company={company}
            stationName={stationName}
            gradeLabel={gradeLabel}
            managerName={manager?.name}
            hrManagerName={hrManager?.name}
            docNumber={meta.docNumber}
            fingerprint={meta.fingerprint}
            ar={ar}
          />
        </div>
      </div>
    </div>
  );
}