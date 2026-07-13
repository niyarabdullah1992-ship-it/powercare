import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { deleteEmployeeAccount } from "@/lib/store";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function DeleteEmployeeAccountCard({ employee, companyId }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const ar = lang === "ar";

  const remove = async () => {
    setDeleting(true); setError("");
    try {
      const ok = await deleteEmployeeAccount(companyId, employee.id);
      if (ok) navigate("/app/employees");
      else setError(ar ? "تعذر حذف الحساب." : "Account could not be deleted.");
    } catch {
      setError(ar ? "تعذر حذف الحساب." : "Account could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-5 space-y-3">
      <h3 className="flex items-center gap-2 font-heading font-semibold text-destructive"><Trash2 className="h-4 w-4" />{ar ? "حذف حساب الموظف" : "Delete employee account"}</h3>
      <p className="text-xs text-muted-foreground">{ar ? "متاح لمسؤولي الموارد البشرية فقط، ويوقف دخول الموظف نهائيًا." : "Available only to HR staff and permanently revokes employee access."}</p>
      <ConfirmDeleteDialog onConfirm={remove} title={ar ? "حذف حساب الموظف؟" : "Delete employee account?"} description={ar ? "سيتم حذف الحساب وبيانات الدخول ولا يمكن التراجع." : "The account and login access will be deleted permanently."} trigger={<button disabled={deleting} className="flex items-center gap-2 rounded-md border border-destructive px-3 py-2 text-sm text-destructive disabled:opacity-50">{deleting && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "حذف الحساب" : "Delete account"}</button>} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}