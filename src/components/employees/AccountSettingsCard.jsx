import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany, setEmployeePassword, changeOwnerPassword } from "@/lib/store";
import { KeyRound, Pencil } from "lucide-react";

// Self-service account settings — any signed-in user can change their own
// display name and login password from their profile page.
export default function AccountSettingsCard({ employee, company }) {
  const { t } = useI18n();
  const [name, setName] = useState(employee.name);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

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
    <div className="p-5 border border-border rounded-xl bg-card space-y-4">
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
    </div>
  );
}