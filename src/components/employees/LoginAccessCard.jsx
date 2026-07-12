import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { KeyRound } from "lucide-react";
import { setEmployeePassword } from "@/lib/store";

export default function LoginAccessCard({ employee, companyId }) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setMessage(t("passwordTooShort")); return; }
    setSaving(true);
    setMessage("");
    const ok = await setEmployeePassword(companyId, employee.id, employee.email, password);
    setSaving(false);
    setMessage(ok ? t("employeePasswordSaved") : t("employeePasswordFailed"));
    if (ok) setPassword("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-4 h-4 text-accent" />
        <h3 className="font-heading text-lg">{t("loginAccess")}</h3>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-3">{t("loginAccessNote")}</p>
      {!employee.email ? (
        <p className="text-xs text-destructive font-body">{t("emailRequiredForLogin")}</p>
      ) : (
        <form onSubmit={save} className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("newEmployeePassword")}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" disabled={saving || !password} className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-body disabled:opacity-50">
            {saving ? "…" : t("save")}
          </button>
        </form>
      )}
      {message && <p className="text-xs font-body mt-2 text-muted-foreground">{message}</p>}
    </div>
  );
}