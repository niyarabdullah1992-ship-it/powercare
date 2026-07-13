import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, setEmployeePassword, changeOwnerPassword, purgeCompanyAccount } from "@/lib/store";
import { KeyRound, Pencil, AlertTriangle, Loader2, Building2 } from "lucide-react";

// Self-service account settings — any signed-in user can change their own
// display name and login password from their profile page.
export default function AccountSettingsCard({ employee, company }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(employee.name);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ownerStep, setOwnerStep] = useState(0); // 0 = idle, 1 = first confirm, 2 = final confirm
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!company.ownerEmail && (employee.email || "").toLowerCase() === company.ownerEmail.toLowerCase();

  const saveName = () => {
    const clean = name.trim();
    if (!clean || clean === employee.name) return;
    updateCompany(company.id, (d) => {
      const emp = d.employees.find((e) => e.id === employee.id);
      if (emp) emp.name = clean;
    });
    setMsg(t("nameUpdated"));
  };

  const savePassword = async () => {
    if (password.length < 6) { setMsg(t("passwordTooShort")); return; }
    setSaving(true);
    let ok = false;
    try {
      if (isOwner) ok = await changeOwnerPassword(company.id, password);
      else if (employee.email) ok = await setEmployeePassword(company.id, employee.id, employee.email, password);
    } catch { ok = false; }
    setSaving(false);
    setMsg(ok ? t("passwordUpdated") : t("employeePasswordFailed"));
    if (ok) setPassword("");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading font-semibold">{t("myAccount")}</h3>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground font-body flex items-center gap-1 mb-1"><Pencil className="w-3 h-3" /> {t("employeeName")}</label>
          <input dir="auto" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body" />
        </div>
        <button onClick={saveName} className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body">{t("save")}</button>
      </div>
      {(isOwner || employee.email) ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground font-body flex items-center gap-1 mb-1"><KeyRound className="w-3 h-3" /> {t("newEmployeePassword")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body" />
          </div>
          <button onClick={savePassword} disabled={saving || !password}
            className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">{t("save")}</button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-body">{t("emailRequiredForLogin")}</p>
      )}
      {msg && <p className="text-xs text-accent font-body">{msg}</p>}

      {/* Delete Company Account — owner-only permanent purge with double-confirmation. */}
      {isOwner && (
        <div className="pt-3 border-t border-border space-y-2">
          <h4 className="text-sm font-body font-medium text-destructive flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {ar ? "حذف حساب الشركة" : "Delete Company Account"}
          </h4>
          <p className="text-xs text-muted-foreground font-body">
            {ar
              ? "هذا الإجراء يحذف الشركة نهائيًا: جميع المحطات والموظفين وكل البيانات المخزّنة ستُمسح ولا يمكن استرجاعها."
              : "This permanently purges the company: all stations, employees and every stored data record will be erased and cannot be recovered."}
          </p>
          {ownerStep === 0 && (
            <button
              onClick={() => setOwnerStep(1)}
              className="px-4 py-2 rounded-md border border-destructive/50 text-destructive text-sm font-body hover:bg-destructive/10"
            >
              {ar ? "حذف حساب الشركة" : "Delete Company Account"}
            </button>
          )}
          {ownerStep === 1 && (
            <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/5 space-y-2">
              <p className="text-xs text-destructive font-body flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {ar
                  ? "تحذير: سيتم مسح الشركة بالكامل — المحطات، الموظفون، المهام، التقارير وكل البيانات."
                  : "Warning: the entire company will be wiped — stations, employees, tasks, reports and all data."}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setOwnerStep(2)} className="px-4 py-2 rounded-md border border-destructive text-destructive text-sm font-body hover:bg-destructive/10">
                  {ar ? "أفهم ذلك — متابعة" : "I understand — continue"}
                </button>
                <button onClick={() => setOwnerStep(0)} className="px-4 py-2 rounded-md border border-border text-sm font-body">
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
          {ownerStep === 2 && (
            <div className="p-3 rounded-lg border border-destructive bg-destructive/10 space-y-2">
              <p className="text-xs text-destructive font-body font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {ar
                  ? "التأكيد النهائي: هذا آخر تحذير — لا يمكن التراجع بعد الآن."
                  : "Final confirmation: this is the last warning — there is no undo after this."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const ok = await purgeCompanyAccount(company.id).catch(() => false);
                    setDeleting(false);
                    if (ok) { logout(); navigate("/"); }
                    else {
                      setOwnerStep(0);
                      setMsg(ar ? "تعذّر حذف حساب الشركة — حاول مجددًا." : "Couldn't delete the company account — please try again.");
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-body disabled:opacity-50"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {ar ? "احذف الشركة نهائيًا" : "Permanently delete company"}
                </button>
                <button disabled={deleting} onClick={() => setOwnerStep(0)} className="px-4 py-2 rounded-md border border-border text-sm font-body">
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}