import React from "react";
import { FileBadge, PencilLine } from "lucide-react";

// خطاب تعريف رسمي — يُفتح في نافذة طباعة ببيانات الموظف الحية.
function printIntroLetter({ employee, companyName, roleLabel, stationName, ar }) {
  const profile = employee.profile || {};
  const today = new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  const salary = Number(profile.baseSalary || 0) + Number(profile.allowances || 0);
  const html = `<!doctype html><html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}"><head><meta charset="utf-8">
  <title>${ar ? "خطاب تعريف" : "Introduction letter"}</title>
  <style>
    body{font-family:'IBM Plex Sans Arabic','Segoe UI',sans-serif;color:#101f3c;margin:0;padding:48px;line-height:2}
    .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f6a3f;padding-bottom:16px;margin-bottom:32px}
    .brand{font-size:22px;font-weight:700}
    .date{font-size:13px;color:#5a6577}
    h1{font-size:20px;text-align:center;margin:24px 0}
    p{font-size:15px;margin:12px 0}
    .sign{margin-top:64px;font-size:14px}
    .muted{color:#5a6577;font-size:12px;margin-top:48px;border-top:1px solid #d8dde6;padding-top:12px}
  </style></head><body>
  <div class="head"><div class="brand">${companyName}</div><div class="date">${today}</div></div>
  <h1>${ar ? "خطاب تعريف بموظف" : "Employee Introduction Letter"}</h1>
  <p>${ar
    ? `تشهد شركة <b>${companyName}</b> بأن الموظف/ـة <b>${employee.name}</b>${profile.jobNumber ? ` (الرقم الوظيفي: ${profile.jobNumber})` : ""} يعمل لدينا بوظيفة <b>${roleLabel}</b>${stationName ? ` في فرع <b>${stationName}</b>` : ""}${profile.hireDate ? ` منذ تاريخ <b>${profile.hireDate}</b>` : ""}${salary ? `، ويتقاضى راتبًا إجماليًا قدره <b>${salary.toLocaleString("ar-EG")} ريال</b> شهريًا` : ""}، ولا يزال على رأس العمل حتى تاريخه.`
    : `This is to certify that <b>${employee.name}</b>${profile.jobNumber ? ` (Employee No: ${profile.jobNumber})` : ""} is employed at <b>${companyName}</b> as <b>${roleLabel}</b>${stationName ? ` at the <b>${stationName}</b> branch` : ""}${profile.hireDate ? ` since <b>${profile.hireDate}</b>` : ""}${salary ? `, with a total monthly salary of <b>SAR ${salary.toLocaleString("en-US")}</b>` : ""}, and remains in active service to date.`}</p>
  <p>${ar ? "وقد أُصدر هذا الخطاب بناءً على طلب الموظف دون أدنى مسؤولية على الشركة تجاه الغير." : "This letter was issued at the employee's request without any liability on the company towards third parties."}</p>
  <div class="sign">${ar ? "الموارد البشرية" : "Human Resources"}<br/><b>${companyName}</b></div>
  <div class="muted">${ar ? "وثيقة صادرة إلكترونيًا من منصة PowerCare" : "Electronically issued via PowerCare"}</div>
  <script>window.onload=function(){window.print()}</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// الشريط العلوي لملف الموظف بنمط NiroVera: الاسم والمسمى والفرع مع أزرار الإجراءات.
export default function ProfileTopBar({ employee, companyName, roleLabel, stationName, ar, canEdit, onEdit }) {
  const profile = employee.profile || {};
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-heading text-xl font-semibold text-primary-foreground">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt={employee.name} className="h-full w-full object-cover" /> : employee.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold">{employee.name}</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {[roleLabel, stationName].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <button onClick={onEdit} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">
            <PencilLine className="h-4 w-4" /> {ar ? "تعديل البيانات" : "Edit data"}
          </button>
        )}
        <button
          onClick={() => printIntroLetter({ employee, companyName, roleLabel, stationName, ar })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          <FileBadge className="h-4 w-4" /> {ar ? "إصدار خطاب تعريف" : "Issue intro letter"}
        </button>
      </div>
    </div>
  );
}