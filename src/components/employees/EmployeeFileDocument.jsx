import React from "react";

const mask = (value) => {
  const text = String(value || "");
  if (!text) return "—";
  if (text.length <= 4) return text;
  return `${text.slice(0, 1)}${"•".repeat(Math.max(text.length - 5, 3))}${text.slice(-4)}`;
};

const fmt = (value, ar) => (value ? new Date(value).toLocaleDateString(ar ? "ar-SA" : "en-GB", { year: "numeric", month: "long", day: "numeric" }) : "—");

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-s-4 border-[#1f6f52] ps-2 text-[13px] font-bold text-[#12304a]">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ items }) {
  return (
    <table className="w-full border-collapse text-[11px]">
      <tbody>
        {items.map(([label, value], i) => (
          <tr key={i} className="border border-[#dfe4ea]">
            <td className="w-1/4 bg-[#f7f9fa] px-3 py-2 text-[#5b6b78]">{label}</td>
            <td className="w-1/4 px-3 py-2 font-medium text-[#12304a]">{value ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Sheet({ children, header, footer }) {
  return (
    <div className="guide-page relative mx-auto flex h-[297mm] w-[210mm] flex-col bg-white p-0 text-[#12304a]" style={{ fontFamily: "'Noto Kufi Arabic', 'Inter Tight', sans-serif" }}>
      {header}
      <div className="flex-1 px-10 py-6">{children}</div>
      {footer}
    </div>
  );
}

// Comprehensive, verifiable employee file — mirrors the official HR document layout.
export default function EmployeeFileDocument({ employee, company, stationName, gradeLabel, listLabel, sectionsLabel, managerName, docNumber, fingerprint, signerName, signatureStampUrl, verificationId, ar }) {
  const p = employee.profile || {};
  const certs = employee.certificates || [];
  const leaves = employee.leaveRequests || [];
  const approvedLeaveDays = leaves.filter((l) => l.status === "approved").reduce((sum, l) => sum + (l.days || 1), 0);
  const issuedAt = new Date();
  const base = Number(p.baseSalary || 0);
  const allowances = Number(p.allowances || 0);
  const currency = p.currency || "SAR";

  const header = (
    <div className="flex items-stretch justify-between bg-[#12304a] text-white">
      <div className="flex items-center gap-3 px-8 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded bg-[#1f6f52] text-sm font-bold">{(company.name || "P").charAt(0)}</span>
        <div>
          <p className="text-[13px] font-bold">{company.name}</p>
          <p className="text-[10px] text-white/70">{ar ? "إدارة الموارد البشرية" : "Human Resources"}</p>
        </div>
      </div>
      <div className="bg-[#eef4f0] px-8 py-4 text-end text-[#12304a]">
        <p className="text-[12px] font-bold">{ar ? "ملف الموظف الشامل" : "Comprehensive Employee File"}</p>
        <p className="text-[10px] text-[#5b6b78]">{docNumber} · {fmt(issuedAt, ar)}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between border-t border-[#dfe4ea] px-10 py-3 text-[9px] text-[#5b6b78]">
      <span>{ar ? "البصمة الرقمية" : "Digital fingerprint"}: {fingerprint}</span>
      <span>{ar ? "سرية: داخلي" : "Confidentiality: Internal"}</span>
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"}>
      <Sheet header={header} footer={footer}>
        <div className="flex items-start justify-between gap-6 border-b border-[#dfe4ea] pb-5">
          <div>
            <h1 className="text-[20px] font-bold">{employee.name}</h1>
            <p className="mt-1 text-[11px] text-[#5b6b78]">{[p.position || employee.position, listLabel, gradeLabel, stationName].filter(Boolean).join(" · ") || "—"}</p>
            <p className="mt-2 text-[11px]">{ar ? "الرقم الوظيفي" : "Employee no."}: <b>{employee.employeeId || employee.id?.slice(0, 8)}</b> · {ar ? "تاريخ التعيين" : "Hire date"}: <b>{fmt(p.hireDate, ar)}</b></p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#eef4f0] text-xl font-bold text-[#1f6f52]">{employee.name.charAt(0)}</span>
        </div>

        <Section title={ar ? "البيانات الشخصية والوظيفية" : "Personal & employment data"}>
          <Rows items={[
            [ar ? "القائمة" : "List", listLabel || "—"],
            [ar ? "المنصب" : "Position", p.position || employee.position || "—"],
            [ar ? "الدرجة" : "Grade", gradeLabel || "—"],
            [ar ? "الأقسام" : "Sections", sectionsLabel || "—"],
            [ar ? "الهوية / الإقامة" : "National ID / Iqama", mask(p.nationalId)],
            [ar ? "تاريخ الميلاد" : "Birth date", fmt(p.birthDate, ar)],
            [ar ? "الجنسية" : "Nationality", p.nationality || "—"],
            [ar ? "الحالة الاجتماعية" : "Marital status", p.maritalStatus || "—"],
            [ar ? "رقم التأمينات (GOSI)" : "GOSI number", mask(p.gosiNumber)],
            [ar ? "نوع العقد" : "Contract type", p.contractType || "—"],
            [ar ? "جوال التواصل" : "Mobile", mask(employee.phone)],
            [ar ? "جهة اتصال الطوارئ" : "Emergency contact", p.emergencyName ? `${p.emergencyName} — ${mask(p.emergencyPhone)}` : "—"],
            [ar ? "المدير المباشر" : "Direct manager", managerName || "—"],
            [ar ? "الحساب البنكي" : "Bank account", mask(p.iban)],
          ]} />
        </Section>

        <Section title={ar ? "الالتزام النظامي" : "Regulatory compliance"}>
          <Rows items={[
            [ar ? "انتهاء الهوية / الإقامة" : "ID expiry", fmt(p.idExpiry, ar)],
            [ar ? "رخصة العمل" : "Work permit", p.workPermitNumber ? `${p.workPermitNumber} — ${fmt(p.workPermitExpiry, ar)}` : "—"],
            [ar ? "الجواز" : "Passport", p.passportNumber ? `${mask(p.passportNumber)} — ${fmt(p.passportExpiry, ar)}` : "—"],
            [ar ? "التأمين الطبي" : "Medical insurance", p.medicalInsuranceNumber ? `${mask(p.medicalInsuranceNumber)} — ${fmt(p.medicalInsuranceExpiry, ar)}` : "—"],
          ]} />
        </Section>

        <Section title={ar ? "الشهادات والمؤهلات" : "Certificates & qualifications"}>
          {certs.length === 0 ? (
            <p className="text-[11px] text-[#5b6b78]">—</p>
          ) : (
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#f7f9fa] text-[#5b6b78]">
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "الشهادة" : "Certificate"}</th>
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "التصنيف" : "Category"}</th>
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td className="border border-[#dfe4ea] px-3 py-2">{c.name}</td>
                    <td className="border border-[#dfe4ea] px-3 py-2">{c.category || "—"}</td>
                    <td className="border border-[#dfe4ea] px-3 py-2">{c.status === "approved" ? (ar ? "موثّقة" : "Verified") : c.status === "rejected" ? (ar ? "مرفوضة" : "Rejected") : (ar ? "قيد الاعتماد" : "Pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </Sheet>

      <Sheet header={header} footer={footer}>
        <Section title={ar ? "الأداء وإثبات الإنجاز" : "Performance"}>
          <Rows items={[
            [ar ? "وزن الجهد المعتمد" : "Approved effort weight", employee.points ?? 0],
            [ar ? "الدرجة الوظيفية" : "Job grade", gradeLabel || "—"],
          ]} />
        </Section>

        <Section title={ar ? "الإجازات" : "Leaves"}>
          <Rows items={[
            [ar ? "رصيد الإجازة السنوية" : "Annual balance", p.annualLeaveTotal ?? "—"],
            [ar ? "المستهلك (معتمد)" : "Consumed (approved)", `${approvedLeaveDays} ${ar ? "يوم" : "days"}`],
            [ar ? "طلبات قيد الاعتماد" : "Pending requests", leaves.filter((l) => l.status === "pending").length],
            [ar ? "إجمالي الطلبات" : "Total requests", leaves.length],
          ]} />
        </Section>

        <Section title={ar ? "مكونات الراتب" : "Salary components"}>
          <Rows items={[
            [ar ? "الراتب الأساسي" : "Base salary", base ? `${base.toLocaleString()} ${currency}` : "—"],
            [ar ? "البدلات" : "Allowances", allowances ? `${allowances.toLocaleString()} ${currency}` : "—"],
            [ar ? "الإجمالي الشهري" : "Monthly total", base ? `${(base + allowances).toLocaleString()} ${currency}` : "—"],
          ]} />
          <p className="mt-2 text-[9px] text-[#5b6b78]">{ar ? "تُصرف الرواتب عبر نظام حماية الأجور (WPS) إلى الحساب البنكي المسجّل." : "Salaries are disbursed via WPS to the registered bank account."}</p>
        </Section>

        <Section title={ar ? "سجل الإجازات" : "Leave history"}>
          {leaves.length === 0 ? <p className="text-[11px] text-[#5b6b78]">—</p> : (
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#f7f9fa] text-[#5b6b78]">
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "النوع" : "Type"}</th>
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "من" : "From"}</th>
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "إلى" : "To"}</th>
                  <th className="border border-[#dfe4ea] px-3 py-2 text-start">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {leaves.slice(-10).map((l) => (
                  <tr key={l.id}>
                    <td className="border border-[#dfe4ea] px-3 py-2">{l.type}</td>
                    <td className="border border-[#dfe4ea] px-3 py-2">{l.startDate}</td>
                    <td className="border border-[#dfe4ea] px-3 py-2">{l.endDate}</td>
                    <td className="border border-[#dfe4ea] px-3 py-2">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <div className="mt-10 border-t border-[#dfe4ea] pt-6">
          <p className="text-[10px] text-[#5b6b78]">{ar ? "التوقيع الرقمي المعتمد" : "Approved digital signature"}</p>
          {signatureStampUrl && <img src={signatureStampUrl} alt="digital signature" className="mt-3 w-[120mm] max-w-full" />}
          <p className="mt-2 text-[10px] font-bold text-[#12304a]">{signerName}</p>
          <p className="text-[9px] text-[#5b6b78]">
            {ar ? "موقّع رقمياً" : "Digitally signed"} · {fmt(issuedAt, ar)}
            {verificationId ? ` · ${ar ? "رقم التحقق" : "Verification ID"}: ${verificationId}` : ""}
          </p>
        </div>
        <p className="mt-4 text-[9px] leading-relaxed text-[#5b6b78]">
          {ar
            ? "صدر هذا المستند آلياً من المنصة ويحمل بصمة رقمية تثبت عدم تعديله بعد الإصدار. البيانات الحساسة مقنّعة جزئياً حسب مستوى الإفصاح."
            : "This document was issued automatically by the platform and carries a digital fingerprint proving it was not altered after issuance. Sensitive data is partially masked."}
        </p>
      </Sheet>
    </div>
  );
}